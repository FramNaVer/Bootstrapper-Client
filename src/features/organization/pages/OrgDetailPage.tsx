import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { organizationApi } from "../api/organization.api"
import { MembersDialog } from "../components/MembersDialog"
import { boardApi } from "@/features/board/api/board.api"
import { CreateBoardDialog } from "@/features/board/components/CreateBoardDialog"
import { useAuth } from "@/features/auth/AuthContext"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CardGridSkeleton } from "@/shared/components/CardGridSkeleton"

export function OrgDetailPage() {
  const { orgId } = useParams() as { orgId: string }
  const { user } = useAuth()

  // ชื่อ org ดึงจาก cache เดิม (หน้า list) ไม่ยิงซ้ำ
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationApi.list,
  })
  const org = organizations?.find((o) => o.id === orgId)
  const canManage = org?.role === "OWNER" || org?.role === "ADMIN"

  const {
    data: boards,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["boards", orgId],
    queryFn: () => boardApi.listBoards(orgId),
  })

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link to="/" className="text-muted-foreground text-sm hover:underline">
        ← องค์กรของฉัน
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{org?.name ?? "องค์กร"}</h1>
        <div className="flex items-center gap-2">
          <MembersDialog
            orgId={orgId}
            currentUserId={user?.id ?? ""}
            canManage={canManage}
            creatorId={org?.createdById}
          />
          <CreateBoardDialog orgId={orgId} />
        </div>
      </div>

      {isLoading && <CardGridSkeleton count={3} />}
      {isError && (
        <p className="text-destructive">โหลดบอร์ดไม่สำเร็จ ลองรีเฟรชอีกครั้ง</p>
      )}

      {boards && boards.length === 0 && (
        <Card className="items-center py-12 text-center">
          <CardHeader>
            <CardTitle>ยังไม่มีบอร์ด</CardTitle>
            <CardDescription>สร้างบอร์ดแรกเพื่อเริ่มจัดการงาน</CardDescription>
          </CardHeader>
        </Card>
      )}

      {boards && boards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              to={`/org/${orgId}/board/${board.id}`}
              className="block"
            >
              <Card className="hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{board.name}</CardTitle>
                  {board.description && (
                    <CardDescription>{board.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
