import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { boardApi } from "../api/board.api"
import { CardItem } from "./CardItem"
import type { Card, List } from "../types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  orgId: string
  boardId: string
  list: List
  cards: Card[] // การ์ดของ list นี้ เรียง position แล้ว (จาก local state ของ BoardPage)
}

export function BoardColumn({ orgId, boardId, list, cards }: Props) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")

  // ทำให้ทั้งคอลัมน์เป็น droppable (id = list.id) → ลากการ์ดมาวางในคอลัมน์ว่างได้
  const { setNodeRef } = useDroppable({ id: list.id })

  const createCard = useMutation({
    mutationFn: () =>
      boardApi.createCard(orgId, boardId, { listId: list.id, title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", boardId] })
      setTitle("")
      setAdding(false)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (title.trim()) createCard.mutate()
  }

  return (
    <div className="bg-card/60 border-border flex max-h-full w-72 shrink-0 flex-col rounded-lg border p-3">
      <h3 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold">
        {list.name}
        <span className="text-muted-foreground font-normal">{cards.length}</span>
      </h3>

      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex min-h-2 flex-col gap-2 overflow-y-auto">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>

      {adding ? (
        <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ชื่อการ์ด…"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createCard.isPending}>
              {createCard.isPending ? "…" : "เพิ่ม"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false)
                setTitle("")
              }}
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-muted-foreground hover:bg-secondary mt-2 rounded-md px-2 py-1.5 text-left text-sm"
        >
          + เพิ่มการ์ด
        </button>
      )}
    </div>
  )
}
