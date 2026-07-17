import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight } from "lucide-react"
import { organizationApi } from "../api/organization.api"
import type { MembershipRole } from "../types"
import { CreateOrganizationDialog } from "../components/CreateOrganizationDialog"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CardGridSkeleton } from "@/shared/components/CardGridSkeleton"
import { avatarColor, initials } from "@/shared/components/Avatar"
import { cn } from "@/lib/utils"

// ป้ายบทบาท: OWNER เน้นสีแบรนด์ / ที่เหลือใช้โทนกลาง
function RoleBadge({ role }: { role?: MembershipRole }) {
  const r = role ?? "MEMBER"
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        r === "OWNER"
          ? "bg-primary/10 text-primary"
          : "bg-secondary text-secondary-foreground"
      )}
    >
      {r}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function OrganizationsPage() {
  const {
    data: organizations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationApi.list,
  })

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">องค์กรของฉัน</h1>
          <p className="text-muted-foreground text-sm">
            เลือกองค์กรเพื่อจัดการบอร์ดและงาน
          </p>
        </div>
        <CreateOrganizationDialog />
      </div>

      {isLoading && <CardGridSkeleton count={3} />}

      {isError && (
        <p className="text-destructive">โหลดรายการองค์กรไม่สำเร็จ ลองรีเฟรชอีกครั้ง</p>
      )}

      {organizations && organizations.length === 0 && (
        <Card className="items-center gap-4 py-12 text-center">
          <CardHeader className="items-center">
            <CardTitle>ยังไม่มีองค์กร</CardTitle>
            <CardDescription>
              สร้างองค์กรแรกของคุณเพื่อเริ่มสร้างบอร์ดและชวนทีมเข้ามาร่วมงาน
            </CardDescription>
          </CardHeader>
          <CreateOrganizationDialog />
        </Card>
      )}

      {organizations && organizations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link key={org.id} to={`/org/${org.id}`} className="group block">
              <Card className="h-full gap-0 py-0 transition-all hover:border-primary hover:shadow-md">
                <div className="flex items-start gap-3 p-4">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                    style={{ backgroundColor: avatarColor(org.id) }}
                  >
                    {initials(org.name, undefined)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="group-hover:text-primary truncate font-semibold transition-colors">
                      {org.name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      @{org.slug}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-auto flex items-center justify-between border-t px-4 py-2.5">
                  <RoleBadge role={org.role} />
                  <span className="text-muted-foreground text-xs">
                    สร้างเมื่อ {formatDate(org.createdAt)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
