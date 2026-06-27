import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { organizationApi } from "../api/organization.api"
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function CreateOrganizationDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  const create = useMutation({
    mutationFn: () => organizationApi.create(name),
    onSuccess: () => {
      // refetch รายการ org → org ใหม่โผล่ทันที
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      setOpen(false)
      setName("")
    },
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
        <Button>+ สร้างองค์กร</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างองค์กรใหม่</DialogTitle>
          <DialogDescription>
            ตั้งชื่อองค์กรของคุณ — คุณจะเป็นเจ้าของ (OWNER) โดยอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="org-name">ชื่อองค์กร</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ทีมพัฒนา, ห้องเรียน ก."
              required
              minLength={2}
              maxLength={80}
              autoFocus
            />
          </div>

          {create.isError && (
            <p className="text-destructive text-sm">
              {getApiErrorMessage(create.error, "สร้างองค์กรไม่สำเร็จ")}
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
