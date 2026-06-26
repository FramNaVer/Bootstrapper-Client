import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { Card } from "../types"

// การ์ดที่ลากได้ — useSortable ผูก id ของการ์ดเข้ากับระบบ dnd-kit
export function CardItem({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-background border-border touch-none rounded-md border p-2.5 text-sm shadow-sm",
        isDragging ? "opacity-50" : "cursor-grab"
      )}
    >
      {card.title}
    </div>
  )
}
