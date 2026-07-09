import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
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
  onCardOpen: (cardId: string) => void
}

export function BoardColumn({ orgId, boardId, list, cards, onCardOpen }: Props) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(list.name)
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  const rename = useMutation({
    mutationFn: () =>
      boardApi.updateList(orgId, boardId, list.id, { name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] })
      setRenaming(false)
    },
  })

  const removeList = useMutation({
    mutationFn: () => boardApi.deleteList(orgId, boardId, list.id),
    onSuccess: () => {
      // ลบคอลัมน์ → การ์ดข้างในหายด้วย (cascade) → refresh ทั้งคู่
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] })
      queryClient.invalidateQueries({ queryKey: ["cards", boardId] })
      toast.success(`ลบลิสต์ "${list.name}" แล้ว`)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (title.trim()) createCard.mutate()
  }

  function saveName() {
    if (name.trim() && name.trim() !== list.name) rename.mutate()
    else {
      setName(list.name)
      setRenaming(false)
    }
  }

  return (
    <div className="bg-card/60 border-border flex max-h-full w-72 shrink-0 flex-col rounded-lg border p-3">
      {/* หัวคอลัมน์: คลิกชื่อเพื่อเปลี่ยน, ปุ่มลบโผล่ตอน hover */}
      <div className="group mb-2 flex items-center justify-between gap-1 px-1">
        {renaming ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName()
              if (e.key === "Escape") {
                setName(list.name)
                setRenaming(false)
              }
            }}
            className="h-7 text-sm font-semibold"
          />
        ) : (
          <>
            <button
              onClick={() => setRenaming(true)}
              className="truncate text-left text-sm font-semibold hover:underline"
              title="คลิกเพื่อเปลี่ยนชื่อ"
            >
              {list.name}
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-muted-foreground text-sm">
                {cards.length}
              </span>
              {confirmDelete ? (
                <span className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => removeList.mutate()}
                    disabled={removeList.isPending}
                    className="text-destructive font-medium"
                  >
                    ลบ?
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-muted-foreground"
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-muted-foreground hover:text-destructive text-sm opacity-0 group-hover:opacity-100"
                  title="ลบคอลัมน์"
                >
                  🗑
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex min-h-2 flex-col gap-2 overflow-y-auto">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onOpen={onCardOpen} />
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
