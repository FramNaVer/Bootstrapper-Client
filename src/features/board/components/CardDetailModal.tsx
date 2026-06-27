import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { boardApi } from "../api/board.api"
import { organizationApi } from "@/features/organization/api/organization.api"
import { useAuth } from "@/features/auth/AuthContext"
import { getApiErrorMessage } from "@/shared/api/errors"
import type { Card } from "../types"
import { Avatar, initials } from "@/shared/components/Avatar"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

// จานสีป้ายแบบ Trello
const LABEL_COLORS = [
  "#61BD4F", "#F2D600", "#FF9F1A", "#EB5A46",
  "#C377E0", "#0079BF", "#00C2E0", "#838C91",
]

// หัวข้อย่อยของแต่ละ section
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
      {children}
    </h3>
  )
}

interface ModalProps {
  orgId: string
  boardId: string
  cardId: string | null
  onClose: () => void
}

export function CardDetailModal({ orgId, boardId, cardId, onClose }: ModalProps) {
  const open = !!cardId

  const card = useQuery({
    queryKey: ["card", cardId],
    queryFn: () => boardApi.getCard(orgId, boardId, cardId!),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        {/* DialogTitle ซ่อนไว้เพื่อ accessibility — หัวเรื่องจริงคือ input แก้ชื่อด้านล่าง */}
        <DialogTitle className="sr-only">รายละเอียดการ์ด</DialogTitle>

        {!card.data ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <CardBody
            key={card.data.id}
            orgId={orgId}
            boardId={boardId}
            card={card.data}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ===================== เนื้อหาหลัก: ชื่อ / รายละเอียด / กำหนดส่ง / ลบ =====================
function CardBody({
  orgId,
  boardId,
  card,
  onClose,
}: {
  orgId: string
  boardId: string
  card: Card
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? "")
  const [confirmDelete, setConfirmDelete] = useState(false)

  // หลังแก้การ์ด: refresh ทั้ง detail (modal) และ list (คอลัมน์บนบอร์ด)
  const invalidateCard = () => {
    queryClient.invalidateQueries({ queryKey: ["card", card.id] })
    queryClient.invalidateQueries({ queryKey: ["cards", boardId] })
  }

  const update = useMutation({
    mutationFn: (data: {
      title?: string
      description?: string | null
      dueDate?: string | null
    }) => boardApi.updateCard(orgId, boardId, card.id, data),
    onSuccess: invalidateCard,
  })

  const remove = useMutation({
    mutationFn: () => boardApi.deleteCard(orgId, boardId, card.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", boardId] })
      onClose()
    },
  })

  // "มีการแก้ที่ยังไม่บันทึก" — ใช้โชว์ปุ่มบันทึก/ยกเลิก (ปุ่มหายไป = บันทึกแล้ว)
  const titleDirty = title.trim() !== "" && title.trim() !== card.title
  const descDirty = description.trim() !== (card.description ?? "")

  const saveTitle = () => {
    if (titleDirty) update.mutate({ title: title.trim() })
  }
  const saveDescription = () => {
    if (descDirty) update.mutate({ description: description.trim() || null })
  }

  const dueValue = card.dueDate ? card.dueDate.slice(0, 10) : ""

  return (
    <div className="flex flex-col gap-5 pr-6">
      {/* ชื่อการ์ด — แก้แล้วต้องกดบันทึกเอง (กดได้ทั้งปุ่มและ Enter) */}
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveTitle()
          }}
          className="hover:border-input h-auto border-transparent px-1 py-0.5 text-lg font-semibold shadow-none"
        />
        {titleDirty && (
          <div className="mt-1.5 flex gap-2">
            <Button size="sm" disabled={update.isPending} onClick={saveTitle}>
              {update.isPending ? "กำลังบันทึก…" : "บันทึก"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTitle(card.title)}>
              ยกเลิก
            </Button>
          </div>
        )}
      </div>

      <LabelSection orgId={orgId} boardId={boardId} cardId={card.id} />

      <AssigneeSection orgId={orgId} boardId={boardId} cardId={card.id} />

      {/* รายละเอียด — แก้แล้วต้องกดบันทึกเอง */}
      <div>
        <SectionLabel>รายละเอียด</SectionLabel>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เพิ่มรายละเอียดเพิ่มเติม…"
          className="min-h-24"
        />
        {descDirty && (
          <div className="mt-1.5 flex gap-2">
            <Button size="sm" disabled={update.isPending} onClick={saveDescription}>
              {update.isPending ? "กำลังบันทึก…" : "บันทึก"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDescription(card.description ?? "")}
            >
              ยกเลิก
            </Button>
          </div>
        )}
      </div>

      {/* กำหนดส่ง */}
      <div>
        <SectionLabel>กำหนดส่ง</SectionLabel>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dueValue}
            onChange={(e) =>
              update.mutate({
                dueDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
            className="w-44"
          />
          {dueValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => update.mutate({ dueDate: null })}
            >
              ล้าง
            </Button>
          )}
        </div>
      </div>

      <CommentSection orgId={orgId} boardId={boardId} cardId={card.id} />

      {/* ลบการ์ด */}
      <div className="flex justify-end border-t pt-4">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">ลบการ์ดนี้?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? "กำลังลบ…" : "ยืนยันลบ"}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            ลบการ์ด
          </Button>
        )}
      </div>
    </div>
  )
}

// ===================== ป้ายกำกับ =====================
function LabelSection({
  orgId,
  boardId,
  cardId,
}: {
  orgId: string
  boardId: string
  cardId: string
}) {
  const queryClient = useQueryClient()
  const [picking, setPicking] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(LABEL_COLORS[0])

  const cardLabels = useQuery({
    queryKey: ["cardLabels", cardId],
    queryFn: () => boardApi.listCardLabels(orgId, boardId, cardId),
  })
  const boardLabels = useQuery({
    queryKey: ["boardLabels", boardId],
    queryFn: () => boardApi.listBoardLabels(orgId, boardId),
    enabled: picking,
  })

  // refresh ทั้ง label ในโมดอล และ chip บนการ์ดในบอร์ด
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["cardLabels", cardId] })
    queryClient.invalidateQueries({ queryKey: ["cards", boardId] })
  }

  const attach = useMutation({
    mutationFn: (labelId: string) =>
      boardApi.attachLabel(orgId, boardId, cardId, labelId),
    onSuccess: refresh,
  })
  const detach = useMutation({
    mutationFn: (labelId: string) =>
      boardApi.detachLabel(orgId, boardId, cardId, labelId),
    onSuccess: refresh,
  })
  const create = useMutation({
    mutationFn: () =>
      boardApi.createLabel(orgId, boardId, { name: newName.trim(), color: newColor }),
    onSuccess: (label) => {
      setNewName("")
      queryClient.invalidateQueries({ queryKey: ["boardLabels", boardId] })
      attach.mutate(label.id) // สร้างแล้วติดให้การ์ดเลย
    },
  })

  const attachedIds = new Set((cardLabels.data ?? []).map((l) => l.id))

  return (
    <div>
      <SectionLabel>ป้ายกำกับ</SectionLabel>
      <div className="flex flex-wrap items-center gap-1.5">
        {(cardLabels.data ?? []).map((label) => (
          <button
            key={label.id}
            onClick={() => detach.mutate(label.id)}
            title="คลิกเพื่อถอดป้าย"
            className="rounded px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name} ✕
          </button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setPicking((p) => !p)}
        >
          + ป้าย
        </Button>
      </div>

      {picking && (
        <div className="bg-muted/40 mt-2 flex flex-col gap-2 rounded-md border p-2">
          <div className="flex flex-wrap gap-1.5">
            {(boardLabels.data ?? []).map((label) => (
              <button
                key={label.id}
                onClick={() =>
                  attachedIds.has(label.id)
                    ? detach.mutate(label.id)
                    : attach.mutate(label.id)
                }
                className="rounded px-2 py-0.5 text-xs font-medium text-white"
                style={{
                  backgroundColor: label.color,
                  opacity: attachedIds.has(label.id) ? 1 : 0.55,
                }}
              >
                {attachedIds.has(label.id) ? "✓ " : ""}
                {label.name}
              </button>
            ))}
          </div>

          {/* สร้างป้ายใหม่ */}
          <div className="flex items-center gap-1.5 border-t pt-2">
            <div className="flex gap-1">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className="size-5 rounded"
                  style={{
                    backgroundColor: c,
                    outline: newColor === c ? "2px solid var(--ring)" : "none",
                    outlineOffset: "1px",
                  }}
                />
              ))}
            </div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ชื่อป้ายใหม่"
              className="h-7 flex-1 text-xs"
            />
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!newName.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              สร้าง
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== ผู้รับผิดชอบ =====================
function AssigneeSection({
  orgId,
  boardId,
  cardId,
}: {
  orgId: string
  boardId: string
  cardId: string
}) {
  const queryClient = useQueryClient()
  const [picking, setPicking] = useState(false)

  const assignees = useQuery({
    queryKey: ["assignees", cardId],
    queryFn: () => boardApi.listAssignees(orgId, boardId, cardId),
  })
  const members = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => organizationApi.listMembers(orgId),
    enabled: picking,
  })

  // refresh ทั้ง assignee ในโมดอล และ avatar บนการ์ดในบอร์ด
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["assignees", cardId] })
    queryClient.invalidateQueries({ queryKey: ["cards", boardId] })
  }

  const assign = useMutation({
    mutationFn: (userId: string) =>
      boardApi.assignMember(orgId, boardId, cardId, userId),
    onSuccess: refresh,
  })
  const unassign = useMutation({
    mutationFn: (userId: string) =>
      boardApi.unassignMember(orgId, boardId, cardId, userId),
    onSuccess: refresh,
  })

  const assignedIds = new Set((assignees.data ?? []).map((a) => a.userId))

  return (
    <div>
      <SectionLabel>ผู้รับผิดชอบ</SectionLabel>
      <div className="flex flex-wrap items-center gap-1.5">
        {(assignees.data ?? []).map((a) => (
          <button
            key={a.userId}
            onClick={() => unassign.mutate(a.userId)}
            title={`${a.displayName ?? a.email} (คลิกเพื่อนำออก)`}
            className="hover:opacity-80"
          >
            <Avatar seed={a.userId} label={initials(a.displayName, a.email)} />
          </button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setPicking((p) => !p)}
        >
          + มอบหมาย
        </Button>
      </div>

      {picking && (
        <div className="bg-muted/40 mt-2 flex flex-col gap-1 rounded-md border p-1">
          {members.isLoading && (
            <p className="text-muted-foreground px-2 py-1 text-xs">กำลังโหลด…</p>
          )}
          {(members.data ?? []).map((m) => (
            <button
              key={m.userId}
              onClick={() =>
                assignedIds.has(m.userId)
                  ? unassign.mutate(m.userId)
                  : assign.mutate(m.userId)
              }
              className="hover:bg-secondary flex items-center gap-2 rounded px-2 py-1 text-left text-sm"
            >
              <Avatar seed={m.userId} label={initials(m.displayName, m.email)} />
              <span className="flex-1 truncate">
                {m.displayName ?? m.email}
              </span>
              {assignedIds.has(m.userId) && (
                <span className="text-muted-foreground text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ===================== ความเห็น =====================
function CommentSection({
  orgId,
  boardId,
  cardId,
}: {
  orgId: string
  boardId: string
  cardId: string
}) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [body, setBody] = useState("")

  const comments = useQuery({
    queryKey: ["comments", cardId],
    queryFn: () => boardApi.listComments(orgId, boardId, cardId),
  })

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["comments", cardId] })

  const add = useMutation({
    mutationFn: () => boardApi.addComment(orgId, boardId, cardId, body.trim()),
    onSuccess: () => {
      setBody("")
      refresh()
    },
  })
  const remove = useMutation({
    mutationFn: (commentId: string) =>
      boardApi.deleteComment(orgId, boardId, cardId, commentId),
    onSuccess: refresh,
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (body.trim()) add.mutate()
  }

  return (
    <div>
      <SectionLabel>ความเห็น</SectionLabel>

      <form onSubmit={submit} className="mb-3 flex flex-col gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="เขียนความเห็น…"
          className="min-h-16"
        />
        {add.isError && (
          <p className="text-destructive text-xs">
            {getApiErrorMessage(add.error, "ส่งความเห็นไม่สำเร็จ")}
          </p>
        )}
        <div>
          <Button type="submit" size="sm" disabled={!body.trim() || add.isPending}>
            {add.isPending ? "กำลังส่ง…" : "ส่งความเห็น"}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {(comments.data ?? []).map((c) => (
          <div key={c.id} className="flex gap-2">
            <Avatar seed={c.authorId} label={initials(c.authorName, c.authorEmail)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {c.authorName ?? c.authorEmail}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(c.createdAt).toLocaleString("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                {user?.id === c.authorId && (
                  <button
                    onClick={() => remove.mutate(c.id)}
                    className="text-muted-foreground hover:text-destructive text-xs"
                  >
                    ลบ
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          </div>
        ))}
        {comments.data && comments.data.length === 0 && (
          <p className="text-muted-foreground text-sm">ยังไม่มีความเห็น</p>
        )}
      </div>
    </div>
  )
}
