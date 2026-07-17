import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { organizationApi } from "../api/organization.api"
import type { Member } from "../types"
import { avatarColor, initials } from "@/shared/components/Avatar"
import { isOnline, lastSeenLabel } from "@/shared/lib/presence"
import { cn } from "@/lib/utils"

// แผงสมาชิกด้านขวาของหน้า org: ออนไลน์ก่อน + สถานะ presence สด
// refetch เป็นระยะ → จุดเขียว/"เห็นล่าสุดเมื่อ" อัปเดตเองโดยไม่ต้องรีเฟรชหน้า
export function MembersPanel({
  orgId,
  currentUserId,
}: {
  orgId: string
  currentUserId: string
}) {
  const { data: members } = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => organizationApi.listMembers(orgId),
    refetchInterval: 60_000, // ให้ presence ไม่ค้าง (heartbeat ฝั่ง server ~45s)
    refetchOnWindowFocus: true,
  })

  // ออนไลน์ขึ้นก่อน แล้วเรียงตามเห็นล่าสุด (ใหม่→เก่า)
  const sorted = useMemo(() => {
    return [...(members ?? [])].sort((a, b) => {
      const oa = isOnline(a.lastSeenAt) ? 1 : 0
      const ob = isOnline(b.lastSeenAt) ? 1 : 0
      if (oa !== ob) return ob - oa
      const ta = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0
      const tb = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0
      return tb - ta
    })
  }, [members])

  const onlineCount = sorted.filter((m) => isOnline(m.lastSeenAt)).length

  return (
    <div className="bg-card rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">สมาชิก</h2>
        <span className="text-muted-foreground text-xs">
          {onlineCount} ออนไลน์ / {sorted.length}
        </span>
      </div>
      <ul className="flex flex-col p-2">
        {sorted.map((m) => (
          <MemberRow
            key={m.userId}
            member={m}
            isSelf={m.userId === currentUserId}
          />
        ))}
      </ul>
    </div>
  )
}

function MemberRow({ member, isSelf }: { member: Member; isSelf: boolean }) {
  const online = isOnline(member.lastSeenAt)
  const name = member.displayName ?? member.email

  return (
    <li className="flex items-center gap-3 rounded-md px-2 py-2">
      {/* avatar + จุดสถานะ */}
      <span className="relative shrink-0">
        <span
          className="flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: avatarColor(member.userId) }}
        >
          {initials(member.displayName, member.email)}
        </span>
        {online && (
          <span className="border-card absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-green-500" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {name}
          {isSelf && (
            <span className="text-muted-foreground font-normal"> (คุณ)</span>
          )}
        </p>
        <p
          className={cn(
            "truncate text-xs",
            online ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
          )}
        >
          {online ? "ออนไลน์" : lastSeenLabel(member.lastSeenAt)}
        </p>
      </div>

      <span
        className={cn(
          "shrink-0 text-[11px] font-medium",
          member.role === "OWNER"
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        {member.role}
      </span>
    </li>
  )
}
