import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { organizationApi } from "../api/organization.api"
import type { MembershipRole } from "../types"
import { getApiErrorMessage } from "@/shared/api/errors"
import { Avatar, initials } from "@/shared/components/Avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const ROLES: MembershipRole[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"]

interface Props {
  orgId: string
  currentUserId: string
  canManage: boolean // OWNER/ADMIN เท่านั้นที่เชิญ/เปลี่ยน role/ลบได้
  creatorId?: string | null // ผู้ก่อตั้ง — ห้ามถูกใครจัดการ
}

export function MembersDialog({
  orgId,
  currentUserId,
  canManage,
  creatorId,
}: Props) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const members = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => organizationApi.listMembers(orgId),
    enabled: open,
  })
  const invitations = useQuery({
    queryKey: ["invitations", orgId],
    queryFn: () => organizationApi.listInvitations(orgId),
    enabled: open && canManage,
  })

  const refreshMembers = () =>
    queryClient.invalidateQueries({ queryKey: ["members", orgId] })
  const refreshInvites = () =>
    queryClient.invalidateQueries({ queryKey: ["invitations", orgId] })

  const changeRole = useMutation({
    mutationFn: (v: { userId: string; role: MembershipRole }) =>
      organizationApi.changeMemberRole(orgId, v.userId, v.role),
    onSuccess: refreshMembers,
  })
  const removeMember = useMutation({
    mutationFn: (userId: string) => organizationApi.removeMember(orgId, userId),
    onSuccess: refreshMembers,
  })
  const revoke = useMutation({
    mutationFn: (invitationId: string) =>
      organizationApi.revokeInvitation(orgId, invitationId),
    onSuccess: refreshInvites,
  })

  // --- invite form ---
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<MembershipRole>("MEMBER")
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const invite = useMutation({
    mutationFn: () => organizationApi.inviteMember(orgId, email.trim(), role),
    onSuccess: ({ acceptUrl }) => {
      setInviteLink(acceptUrl)
      setCopied(false)
      setEmail("")
      refreshInvites()
    },
  })
  function onInvite(e: FormEvent) {
    e.preventDefault()
    if (email.trim()) invite.mutate()
  }
  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setInviteLink(null)
          invite.reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">สมาชิก</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จัดการสมาชิก</DialogTitle>
        </DialogHeader>

        {/* รายชื่อสมาชิก */}
        <div className="flex flex-col gap-2">
          {members.isLoading && (
            <p className="text-muted-foreground text-sm">กำลังโหลด…</p>
          )}
          {(members.data ?? []).map((m) => {
            const isSelf = m.userId === currentUserId
            const isCreator = !!creatorId && m.userId === creatorId
            return (
              <div key={m.userId} className="flex items-center gap-2.5">
                <Avatar seed={m.userId} label={initials(m.displayName, m.email)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {m.displayName ?? m.email}
                    {isSelf && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        (คุณ)
                      </span>
                    )}
                    {isCreator && (
                      <span className="ml-1 text-xs text-amber-600">
                        ★ ผู้ก่อตั้ง
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {m.email}
                  </div>
                </div>

                {/* เปลี่ยน role/ลบ ได้เฉพาะ OWNER/ADMIN, ไม่ใช่ตัวเอง, และไม่ใช่ผู้ก่อตั้ง */}
                {canManage && !isSelf && !isCreator ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) =>
                        changeRole.mutate({
                          userId: m.userId,
                          role: e.target.value as MembershipRole,
                        })
                      }
                      className="border-input h-8 rounded-md border bg-transparent px-2 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeMember.mutate(m.userId)}
                      className="text-muted-foreground hover:text-destructive text-sm"
                      title="นำออกจากองค์กร"
                    >
                      🗑
                    </button>
                  </>
                ) : (
                  <span className="bg-secondary rounded px-2 py-0.5 text-xs">
                    {m.role}
                  </span>
                )}
              </div>
            )
          })}
          {(changeRole.isError || removeMember.isError) && (
            <p className="text-destructive text-xs">
              {getApiErrorMessage(
                changeRole.error ?? removeMember.error,
                "ทำรายการไม่สำเร็จ"
              )}
            </p>
          )}
        </div>

        {/* เชิญสมาชิก + คำเชิญค้าง (เฉพาะ OWNER/ADMIN) */}
        {canManage && (
          <div className="mt-2 flex flex-col gap-3 border-t pt-4">
            <h3 className="text-sm font-semibold">เชิญสมาชิกใหม่</h3>
            <form onSubmit={onInvite} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="อีเมลผู้ถูกเชิญ"
                  required
                  className="flex-1"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as MembershipRole)}
                  className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={invite.isPending}>
                  {invite.isPending ? "…" : "เชิญ"}
                </Button>
              </div>
              {invite.isError && (
                <p className="text-destructive text-xs">
                  {getApiErrorMessage(invite.error, "เชิญไม่สำเร็จ")}
                </p>
              )}
            </form>

            {/* ลิงก์เชิญที่เพิ่งสร้าง → คัดลอกไปแชร์เอง */}
            {inviteLink && (
              <div className="bg-muted/50 flex flex-col gap-1.5 rounded-md border p-2">
                <p className="text-muted-foreground text-xs">
                  ส่งลิงก์นี้ให้ผู้ถูกเชิญ (เปิดได้ภายใน 7 วัน):
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={inviteLink} className="flex-1 text-xs" />
                  <Button type="button" size="sm" onClick={copyLink}>
                    {copied ? "คัดลอกแล้ว ✓" : "คัดลอก"}
                  </Button>
                </div>
              </div>
            )}

            {/* คำเชิญที่ยังค้าง */}
            {(invitations.data ?? []).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <h4 className="text-muted-foreground text-xs font-semibold">
                  คำเชิญค้างอยู่
                </h4>
                {(invitations.data ?? []).map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{inv.email}</span>
                    <span className="bg-secondary rounded px-2 py-0.5 text-xs">
                      {inv.role}
                    </span>
                    <button
                      onClick={() => revoke.mutate(inv.id)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
