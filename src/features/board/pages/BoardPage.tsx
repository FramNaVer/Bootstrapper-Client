import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
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
import { useBoardRealtime } from "../useBoardRealtime"
import { BoardColumn } from "../components/BoardColumn"
import { CardDetailModal } from "../components/CardDetailModal"
import { ActivityFeed } from "../components/ActivityFeed"
import type { Card } from "../types"
import { useAuth } from "@/features/auth/AuthContext"
import { Avatar, initials } from "@/shared/components/Avatar"
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
  const navigate = useNavigate()

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

  // real-time: คนอื่นเปลี่ยนบอร์ดนี้ → refetch อัตโนมัติ + รายชื่อคนที่กำลังดูบอร์ด
  const { user } = useAuth()
  const presence = useBoardRealtime(boardId)
  // โชว์เฉพาะ "คนอื่น" ที่กำลังดู (ตัดตัวเองออก)
  const others = presence.filter((p) => p.userId !== user?.id)

  const sortedLists = useMemo(
    () => [...(lists.data ?? [])].sort((a, b) => a.position - b.position),
    [lists.data]
  )

  // --- local state ของการ์ดต่อคอลัมน์ (ขยับระหว่างลากได้ทันที) ---
  // ใช้ ref คู่กัน เพื่อให้ handler อ่าน state ล่าสุดเสมอ (กัน stale closure ตอนลาก)
  const [columns, setColumns] = useState<Record<string, Card[]>>({})
  const columnsRef = useRef<Record<string, Card[]>>({})
  // กำลังลากอยู่ไหม — กัน refetch (เช่นจาก real-time ของคนอื่น) มาทับ local state กลางคัน
  const draggingRef = useRef(false)
  const commit = (next: Record<string, Card[]>) => {
    columnsRef.current = next
    setColumns(next)
  }

  // sync จาก server → local ทุกครั้งที่ข้อมูลเปลี่ยน (สร้างการ์ด/หลัง move refetch/real-time)
  useEffect(() => {
    if (draggingRef.current) return // อยู่ระหว่างลาก → ข้ามไปก่อน (drag-end จะ refetch sync เอง)
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

  // การ์ดที่เปิด modal รายละเอียดอยู่ (null = ปิด)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  // deep link: /org/../board/..?card=<id> (มาจากปฏิทิน — อนาคตใช้กับแจ้งเตือนได้)
  // เปิด modal แล้วล้าง param ทิ้งทันทีด้วย replace: ปิด modal/refresh จะได้ไม่เด้งซ้ำ
  // และปุ่ม back ไม่ต้องเจอ URL ที่มี ?card= ค้างเป็น step เพิ่ม
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const cardId = searchParams.get("card")
    if (cardId) {
      setOpenCardId(cardId)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

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
    draggingRef.current = true
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
    draggingRef.current = false
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

  // --- rename / delete board ---
  const [boardRenaming, setBoardRenaming] = useState(false)
  const [boardName, setBoardName] = useState("")
  const [confirmDeleteBoard, setConfirmDeleteBoard] = useState(false)

  const renameBoard = useMutation({
    mutationFn: () =>
      boardApi.updateBoard(orgId, boardId, { name: boardName.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] })
      queryClient.invalidateQueries({ queryKey: ["boards", orgId] })
      setBoardRenaming(false)
    },
  })

  const removeBoard = useMutation({
    mutationFn: () => boardApi.deleteBoard(orgId, boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", orgId] })
      toast.success("ลบบอร์ดแล้ว")
      navigate(`/org/${orgId}`) // ลบทั้งบอร์ดแล้ว → กลับหน้า org
    },
  })

  function startRenameBoard() {
    setBoardName(board.data?.name ?? "")
    setBoardRenaming(true)
  }
  function saveBoardName() {
    if (boardName.trim() && boardName.trim() !== board.data?.name) {
      renameBoard.mutate()
    } else {
      setBoardRenaming(false)
    }
  }

  return (
    // h-full = เต็มพื้นที่ main ของ shell (เลิก hardcode ความสูง header เดิม)
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-3">
        <Link
          to={`/org/${orgId}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← บอร์ด
        </Link>

        {boardRenaming ? (
          <Input
            autoFocus
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onBlur={saveBoardName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveBoardName()
              if (e.key === "Escape") setBoardRenaming(false)
            }}
            className="h-8 w-64 text-lg font-semibold"
          />
        ) : (
          <button
            onClick={startRenameBoard}
            className="text-lg font-semibold hover:underline"
            title="คลิกเพื่อเปลี่ยนชื่อบอร์ด"
          >
            {board.data?.name ?? "บอร์ด"}
          </button>
        )}

        {/* presence + ประวัติ + ลบทั้งบอร์ด — ดันไปขวาสุด */}
        <div className="ml-auto flex items-center gap-2">
          {others.length > 0 && (
            <div className="flex -space-x-2 pr-1" title="กำลังดูบอร์ดนี้">
              {others.slice(0, 5).map((u) => (
                <span
                  key={u.userId}
                  className="ring-background rounded-full ring-2"
                >
                  <Avatar
                    small
                    seed={u.userId}
                    label={initials(u.displayName, u.email)}
                    title={u.displayName ?? u.email}
                  />
                </span>
              ))}
              {others.length > 5 && (
                <span className="text-muted-foreground self-center pl-2 text-xs">
                  +{others.length - 5}
                </span>
              )}
            </div>
          )}
          <ActivityFeed orgId={orgId} boardId={boardId} />
          {confirmDeleteBoard ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">ลบทั้งบอร์ด?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteBoard(false)}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={removeBoard.isPending}
                onClick={() => removeBoard.mutate()}
              >
                {removeBoard.isPending ? "กำลังลบ…" : "ยืนยันลบ"}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDeleteBoard(true)}
            >
              ลบบอร์ด
            </Button>
          )}
        </div>
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
                onCardOpen={setOpenCardId}
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

      <CardDetailModal
        orgId={orgId}
        boardId={boardId}
        cardId={openCardId}
        onClose={() => setOpenCardId(null)}
      />
    </div>
  )
}
