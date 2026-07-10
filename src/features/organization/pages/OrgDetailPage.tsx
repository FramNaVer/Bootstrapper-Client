import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { organizationApi } from "../api/organization.api"
import { MembersDialog } from "../components/MembersDialog"
import { OrgCalendar } from "../components/OrgCalendar"
import { CreateBoardDialog } from "@/features/board/components/CreateBoardDialog"
import { useAuth } from "@/features/auth/AuthContext"

// "โฮมขององค์กร" — โชว์เฉพาะสิ่งที่ sidebar ทำแทนไม่ได้: ภาพรวมข้ามบอร์ด
// (grid รายชื่อบอร์ดเดิมถูกถอดออก เพราะซ้ำกับ sidebar ของ shell 100%)
export function OrgDetailPage() {
  const { orgId } = useParams() as { orgId: string }
  const { user } = useAuth()

  // ชื่อ org ดึงจาก cache เดิม (rail/หน้า list โหลดไว้แล้ว) ไม่ยิงซ้ำ
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationApi.list,
  })
  const org = organizations?.find((o) => o.id === orgId)
  const canManage = org?.role === "OWNER" || org?.role === "ADMIN"

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">
            {org?.name ?? "องค์กร"}
          </h1>
          <p className="text-muted-foreground text-sm">
            ปฏิทินกำหนดส่งรวมจากทุกบอร์ดขององค์กร
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <MembersDialog
            orgId={orgId}
            currentUserId={user?.id ?? ""}
            canManage={canManage}
            creatorId={org?.createdById}
          />
          <CreateBoardDialog orgId={orgId} />
        </div>
      </div>

      <OrgCalendar orgId={orgId} />
    </div>
  )
}
