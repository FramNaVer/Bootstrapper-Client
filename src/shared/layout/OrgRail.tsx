import { Link, useMatch } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { organizationApi } from "@/features/organization/api/organization.api"
import { CreateOrganizationDialog } from "@/features/organization/components/CreateOrganizationDialog"
import { avatarColor, initials } from "@/shared/components/Avatar"
import { cn } from "@/lib/utils"

// แถบซ้ายสุดแบบ Discord: ไอคอนกลมของแต่ละ org + ปุ่มสร้างใหม่
//
// ทำไมใช้ useMatch ไม่ใช่ useParams: layout อยู่ "เหนือ" route ลูกใน tree
// params ไหลจากพ่อลงลูกทางเดียว — useParams ตรงนี้จะได้ {} เสมอ
// useMatch เทียบ pattern กับ URL ปัจจุบันตรงๆ เลยเห็น :orgId ได้
export function OrgRail() {
  const orgMatch = useMatch("/org/:orgId/*")
  const activeOrgId = orgMatch?.params.orgId

  // key เดียวกับหน้า OrganizationsPage → ใช้ cache ร่วมกัน ไม่ยิง API ซ้ำ
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationApi.list,
  })

  return (
    <nav className="bg-secondary/60 flex w-18 shrink-0 flex-col items-center gap-2 overflow-y-auto border-r py-3">
      {/* ปุ่มโฮม — กลับหน้ารวมองค์กร */}
      <Link
        to="/"
        title="หน้าหลัก"
        className={cn(
          "bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center font-bold transition-all",
          // ทรงเหลี่ยมมน = หน้าที่เปิดอยู่ / ทรงกลม = ยังไม่เปิด (ภาษาเดียวกับ Discord)
          !activeOrgId ? "rounded-xl" : "rounded-3xl hover:rounded-xl"
        )}
      >
        B
      </Link>
      <div className="bg-border h-px w-8 shrink-0" />

      {organizations?.map((org) => {
        const active = org.id === activeOrgId
        return (
          <Link
            key={org.id}
            to={`/org/${org.id}`}
            title={org.name}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center font-semibold text-white transition-all",
              active
                ? "ring-primary rounded-xl ring-2"
                : "rounded-3xl hover:rounded-xl"
            )}
            style={{ backgroundColor: avatarColor(org.id) }}
          >
            {initials(org.name, undefined)}
          </Link>
        )
      })}

      <CreateOrganizationDialog
        trigger={
          <button
            title="สร้างองค์กรใหม่"
            className="text-primary bg-card hover:bg-primary hover:text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-3xl border transition-all hover:rounded-xl"
          >
            <Plus className="size-5" />
          </button>
        }
      />
    </nav>
  )
}
