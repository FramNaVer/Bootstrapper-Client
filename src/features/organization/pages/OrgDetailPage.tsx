import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { organizationApi } from "../api/organization.api"
import { MembersDialog } from "../components/MembersDialog"
import { MembersPanel } from "../components/MembersPanel"
import { OrgCalendar } from "../components/OrgCalendar"
import { boardApi } from "@/features/board/api/board.api"
import { CreateBoardDialog } from "@/features/board/components/CreateBoardDialog"
import { useAuth } from "@/features/auth/AuthContext"
import { useTheme } from "@/shared/theme/ThemeProvider"
import { isOnline } from "@/shared/lib/presence"
import { cn } from "@/lib/utils"

// key ประจำวันแบบ YYYY-MM-DD (local) — จับคู่กับ dueDate ของการ์ด
function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

// ช่วงสัปดาห์นี้ (จันทร์–อาทิตย์) ตามเวลา local
function thisWeekRange() {
  const now = new Date()
  const diffToMon = (now.getDay() + 6) % 7 // 0=อาทิตย์ → ถอยไปจันทร์
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  return { mondayKey: dateKey(monday), sundayKey: dateKey(sunday) }
}

// "โฮมขององค์กร" — ภาพรวมข้ามบอร์ด: สถิติ + ปฏิทินกำหนดส่ง + สมาชิก (presence สด)
export function OrgDetailPage() {
  const { orgId } = useParams() as { orgId: string }
  const { user } = useAuth()

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationApi.list,
  })
  const org = organizations?.find((o) => o.id === orgId)
  const canManage = org?.role === "OWNER" || org?.role === "ADMIN"

  const { data: boards } = useQuery({
    queryKey: ["boards", orgId],
    queryFn: () => boardApi.listBoards(orgId),
  })

  const { data: members } = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => organizationApi.listMembers(orgId),
    refetchInterval: 60_000,
  })

  // การ์ดกำหนดส่งย้อนหลังทั้งหมด → ปลายสัปดาห์นี้ (พอสำหรับนับ เลยกำหนด + สัปดาห์นี้)
  const { mondayKey, sundayKey } = thisWeekRange()
  const todayKey = dateKey(new Date())
  const { data: dueCards } = useQuery({
    queryKey: ["due-stats", orgId, sundayKey],
    queryFn: () => organizationApi.listDueCards(orgId, "2000-01-01", sundayKey),
  })

  const overdue = dueCards?.filter((c) => c.dueDate.slice(0, 10) < todayKey).length
  const dueThisWeek = dueCards?.filter((c) => {
    const k = c.dueDate.slice(0, 10)
    return k >= mondayKey && k <= sundayKey
  }).length
  const onlineCount = members?.filter((m) => isOnline(m.lastSeenAt)).length ?? 0

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">
            {org?.name ?? "องค์กร"}
          </h1>
          <p className="text-muted-foreground text-sm">
            ภาพรวมองค์กร บอร์ด งาน และสมาชิกทั้งหมดในที่เดียว
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <MembersDialog
            orgId={orgId}
            currentUserId={user?.id ?? ""}
            canManage={canManage}
            creatorId={org?.createdById}
          />
          <CreateBoardDialog orgId={orgId} />
        </div>
      </div>

      {/* สถิติภาพรวม */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          dotClass="bg-primary"
          label="บอร์ดทั้งหมด"
          value={boards?.length}
          hint="ในองค์กรนี้"
        />
        <StatTile
          dotClass="bg-blue-500"
          label="กำหนดส่งสัปดาห์นี้"
          value={dueThisWeek}
          hint="การ์ดที่ต้องติดตาม"
        />
        <StatTile
          dotClass="bg-destructive"
          label="เลยกำหนด"
          value={overdue}
          hint="ต้องจัดการด่วน"
        />
        <StatTile
          dotClass="bg-green-500"
          label="สมาชิก"
          value={members?.length}
          hint={`${onlineCount} ออนไลน์ตอนนี้`}
        />
      </div>

      {/* ปฏิทิน (ซ้าย) + สมาชิก (ขวา) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-card rounded-xl border p-4 lg:col-span-2">
          <OrgCalendar orgId={orgId} />
        </div>
        <MembersPanel orgId={orgId} currentUserId={user?.id ?? ""} />
      </div>
    </div>
  )
}

function StatTile({
  dotClass,
  label,
  value,
  hint,
}: {
  dotClass: string
  label: string
  value: number | undefined
  hint: string
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span className={cn("size-2 rounded-full", dotClass)} />
        {label}
      </div>
      <p className="mt-1 text-3xl font-bold">{value ?? "—"}</p>
      <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
    </div>
  )
}

// สลับธีมแบบ segmented (สว่าง/มืด) — ใช้ toggleTheme เดิม กดฝั่งที่ active อยู่แล้ว = no-op
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const btn = (target: "light" | "dark", labelText: string) => (
    <button
      type="button"
      onClick={() => theme !== target && toggleTheme()}
      className={cn(
        "rounded-md px-3 py-1 text-sm font-medium transition-colors",
        theme === target
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {labelText}
    </button>
  )
  return (
    <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
      {btn("light", "สว่าง")}
      {btn("dark", "มืด")}
    </div>
  )
}
