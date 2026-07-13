import { useState, type FormEvent, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { boardApi } from "../api/board.api"
import { getApiErrorMessage } from "@/shared/api/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// trigger: ปุ่มเปิด dialog กำหนดเองได้ (เช่นปุ่ม + เล็กใน sidebar) — ไม่ส่ง = ปุ่มเดิม
export function CreateBoardDialog({
  orgId,
  trigger,
}: {
  orgId: string
  trigger?: ReactNode
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  const create = useMutation({
    mutationFn: () => boardApi.createBoard(orgId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", orgId] })
      setOpen(false)
      setName("")
    },
    meta: { silent: true }, // error inline ใน dialog แล้ว
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setName("")
          create.reset()
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button>+ สร้างบอร์ด</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างบอร์ดใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="board-name">ชื่อบอร์ด</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Sprint 1, งานบ้าน"
              required
              minLength={2}
              maxLength={80}
              autoFocus
            />
          </div>
          {create.isError && (
            <p className="text-destructive text-sm">
              {getApiErrorMessage(create.error, "สร้างบอร์ดไม่สำเร็จ")}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "กำลังสร้าง…" : "สร้าง"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
