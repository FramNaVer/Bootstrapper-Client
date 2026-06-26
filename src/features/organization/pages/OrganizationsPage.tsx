import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { organizationApi } from "../api/organization.api"
import { CreateOrganizationDialog } from "../components/CreateOrganizationDialog"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CardGridSkeleton } from "@/shared/components/CardGridSkeleton"

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
        <Card className="items-center py-12 text-center">
          <CardHeader>
            <CardTitle>ยังไม่มีองค์กร</CardTitle>
            <CardDescription>
              สร้างองค์กรแรกของคุณเพื่อเริ่มสร้างบอร์ด
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {organizations && organizations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link key={org.id} to={`/org/${org.id}`} className="block">
              <Card className="hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>
                    <span className="bg-secondary rounded px-2 py-0.5 text-xs">
                      {org.role ?? "MEMBER"}
                    </span>
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
