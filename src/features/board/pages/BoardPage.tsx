import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { boardApi } from "../api/board.api"
import { BoardColumn } from "../components/BoardColumn"
import type { Card } from "../types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const POSITION_GAP = 1000

// คำนวณ position ใหม่ของการ์ดจาก "เพื่อนบ้าน" หลังวาง (client เป็นคนคิด ส่งให้ backend)
function computePosition(items: Card[], index: number): number {
  const prev = items[index - 1]
  const next = items[index + 1]
  if (prev && next) return (prev.position + next.position) / 2 // แทรกกลาง
  if (prev) return prev.position + POSITION_GAP // ต่อท้าย
  if (next) return next.position / 2 // ขึ้นหัว
  return POSITION_GAP // คอลัมน์ว่าง
}

export function BoardPage() {
  const { orgId, boardId } = useParams() as { orgId: string; boardId: string }
  const queryClient = useQueryClient()

  const board = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => boardApi.getBoard(orgId, boardId),
  })
  const lists = useQuery({
    queryKey: ["lists", boardId],
    queryFn: () => boardApi.listLists(orgId, boardId),
  })
  const cards = useQuery({
    queryKey: ["cards", boardId],
    queryFn: () => boardApi.listCards(orgId, boardId),
  })

  const sortedLists = useMemo(
    () => [...(lists.data ?? [])].sort((a, b) => a.position - b.position),
    [lists.data]
  )

  // --- local state ของการ์ดต่อคอลัมน์ (ขยับระหว่างลากได้ทันที) ---
  // ใช้ ref คู่กัน เพื่อให้ handler อ่าน state ล่าสุดเสมอ (กัน stale closure ตอนลาก)
  const [columns, setColumns] = useState<Record<string, Card[]>>({})
  const columnsRef = useRef<Record<string, Card[]>>({})
  const commit = (next: Record<string, Card[]>) => {
    columnsRef.current = next
    setColumns(next)
  }

  // sync จาก server → local ทุกครั้งที่ข้อมูลเปลี่ยน (สร้างการ์ด/หลัง move refetch)
  useEffect(() => {
    const grouped: Record<string, Card[]> = {}
    for (const list of lists.data ?? []) grouped[list.id] = []
    for (const c of cards.data ?? []) (grouped[c.listId] ??= []).push(c)
    for (const id in grouped) grouped[id].sort((a, b) => a.position - b.position)
    commit(grouped)
  }, [cards.data, lists.data])

  const findColumn = (id: string): string | undefined => {
    const cols = columnsRef.current
    if (id in cols) return id // id เป็นคอลัมน์เอง (ลากลงพื้นที่ว่าง)
    return Object.keys(cols).find((col) => cols[col].some((c) => c.id === id))
  }

  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const startColRef = useRef<string | undefined>(undefined)

  const sensors = useSensors(
    // ต้องลากเกิน 5px ถึงเริ่ม drag → คลิกปุ่ม/ฟอร์มในการ์ดยังทำงานปกติ
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const move = useMutation({
    mutationFn: (v: { cardId: string; targetListId: string; position: number }) =>
      boardApi.moveCard(orgId, boardId, v.cardId, {
        targetListId: v.targetListId,
        position: v.position,
      }),
    // ไม่ว่าสำเร็จหรือพลาด → refetch เพื่อ sync ความจริงจาก server (พลาด = revert เอง)
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["cards", boardId] }),
  })

  function handleDragStart(e: DragStartEvent) {
    const id = e.active.id as string
    const col = findColumn(id)
    startColRef.current = col
    setActiveCard(col ? columnsRef.current[col].find((c) => c.id === id) ?? null : null)
  }

  // ลากข้ามคอลัมน์ → ย้ายการ์ดใน local state ให้ตามเคอร์เซอร์
  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string
    const fromCol = findColumn(activeId)
    const toCol = findColumn(overId)
    if (!fromCol || !toCol || fromCol === toCol) return

    const cols = columnsRef.current
    const card = cols[fromCol].find((c) => c.id === activeId)
    if (!card) return
    let overIndex = cols[toCol].findIndex((c) => c.id === overId)
    if (overIndex < 0) overIndex = cols[toCol].length // วางบนพื้นที่ว่างคอลัมน์ → ท้ายสุด

    commit({
      ...cols,
      [fromCol]: cols[fromCol].filter((c) => c.id !== activeId),
      [toCol]: [
        ...cols[toCol].slice(0, overIndex),
        card,
        ...cols[toCol].slice(overIndex),
      ],
    })
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveCard(null)
    if (!over) return
    const activeId = active.id as string
    const col = findColumn(activeId)
    if (!col) return

    const cols = columnsRef.current
    const items = cols[col]
    const oldIndex = items.findIndex((c) => c.id === activeId)
    let newIndex = items.findIndex((c) => c.id === (over.id as string))
    if (newIndex < 0) newIndex = items.length - 1

    let finalItems = items
    if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
      finalItems = arrayMove(items, oldIndex, newIndex)
      commit({ ...cols, [col]: finalItems })
    }

    // ไม่มีอะไรเปลี่ยน (วางที่เดิม คอลัมน์เดิม) → ไม่ต้องยิง API
    const movedColumn = col !== startColRef.current
    if (!movedColumn && oldIndex === newIndex) return

    const idx = finalItems.findIndex((c) => c.id === activeId)
    move.mutate({
      cardId: activeId,
      targetListId: col,
      position: computePosition(finalItems, idx),
    })
  }

  // --- add list ---
  const [listName, setListName] = useState("")
  const createList = useMutation({
    mutationFn: () => boardApi.createList(orgId, boardId, listName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] })
      setListName("")
    },
  })
  function addList(e: FormEvent) {
    e.preventDefault()
    if (listName.trim()) createList.mutate()
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center gap-3 px-6 py-3">
        <Link
          to={`/org/${orgId}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← บอร์ด
        </Link>
        <h1 className="text-lg font-semibold">{board.data?.name ?? "บอร์ด"}</h1>
      </div>

      {lists.isError && <p className="text-destructive px-6">โหลดบอร์ดไม่สำเร็จ</p>}

      {lists.isLoading ? (
        <div className="flex gap-4 px-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-72 rounded-lg" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 items-start gap-4 overflow-x-auto px-6 pb-6">
            {sortedLists.map((list) => (
              <BoardColumn
                key={list.id}
                orgId={orgId}
                boardId={boardId}
                list={list}
                cards={columns[list.id] ?? []}
              />
            ))}

            <form
              onSubmit={addList}
              className="bg-card/40 w-72 shrink-0 rounded-lg border border-dashed p-3"
            >
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="+ เพิ่มคอลัมน์ (เช่น To Do)"
              />
              {listName.trim() && (
                <Button
                  type="submit"
                  size="sm"
                  className="mt-2"
                  disabled={createList.isPending}
                >
                  {createList.isPending ? "กำลังเพิ่ม…" : "เพิ่มคอลัมน์"}
                </Button>
              )}
            </form>
          </div>

          {/* การ์ดที่ลอยตามเคอร์เซอร์ขณะลาก (ไม่ใช้ useSortable เพื่อกัน id ซ้ำ) */}
          <DragOverlay>
            {activeCard ? (
              <div className="bg-background border-border rounded-md border p-2.5 text-sm shadow-lg">
                {activeCard.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
