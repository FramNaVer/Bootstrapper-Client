import { useRef } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { Card } from "../types"

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
        "bg-background border-border touch-none rounded-md border p-2.5 text-sm shadow-sm",
        isDragging ? "opacity-50" : "cursor-grab"
      )}
    >
      {card.title}
    </div>
  )
}
