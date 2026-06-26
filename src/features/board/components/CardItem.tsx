import { useRef } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { Card } from "../types"
import { Avatar, initials } from "./Avatar"

// แปลงวันที่ครบกำหนดเป็นข้อความสั้น เช่น "30 มิ.ย."
function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  })
}

// การ์ดที่ลากได้ — useSortable ผูก id ของการ์ดเข้ากับระบบ dnd-kit
export function CardItem({
  card,
  onOpen,
}: {
  card: Card
  onOpen: (cardId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  // แยก "คลิก" จาก "ลาก": จำตำแหน่ง pointer ตอนกด แล้วเทียบตอนปล่อย
  // ขยับน้อยกว่า 5px = ตั้งใจคลิก → เปิด modal (ไม่ชนกับ drag เพราะ drag เริ่มที่ >5px)
  // ใช้ onPointerDownCapture (คนละ prop กับ listeners.onPointerDown ของ dnd-kit จึงไม่ทับกัน)
  const downAt = useRef<{ x: number; y: number } | null>(null)

  const labels = card.labels ?? []
  const assignees = card.assignees ?? []
  // เลยกำหนดส่งหรือยัง (เทียบแค่ระดับวัน)
  const overdue =
    card.dueDate && new Date(card.dueDate) < new Date(new Date().toDateString())

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDownCapture={(e) => {
        downAt.current = { x: e.clientX, y: e.clientY }
      }}
      onClick={(e) => {
        const d = downAt.current
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) {
          onOpen(card.id)
        }
      }}
      className={cn(
        "bg-background border-border touch-none rounded-md border p-2.5 shadow-sm",
        isDragging ? "opacity-50" : "cursor-grab"
      )}
    >
      {/* แถบสีป้ายกำกับ */}
      {labels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {labels.map((l) => (
            <span
              key={l.id}
              title={l.name}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: l.color }}
            />
          ))}
        </div>
      )}

      <p className="text-sm">{card.title}</p>

      {/* ท้ายการ์ด: กำหนดส่ง + avatar คนรับผิดชอบ */}
      {(card.dueDate || assignees.length > 0) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {card.dueDate ? (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-medium",
                overdue
                  ? "bg-destructive/15 text-destructive"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              🕑 {formatDue(card.dueDate)}
            </span>
          ) : (
            <span />
          )}

          {assignees.length > 0 && (
            <div className="flex items-center gap-0.5">
              {assignees.slice(0, 3).map((a) => (
                <Avatar
                  key={a.userId}
                  small
                  seed={a.userId}
                  label={initials(a.displayName, a.email)}
                  title={a.displayName ?? a.email}
                />
              ))}
              {assignees.length > 3 && (
                <span className="text-muted-foreground text-[11px]">
                  +{assignees.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
