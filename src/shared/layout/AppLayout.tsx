import { useEffect, useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { Menu } from "lucide-react"
import { NotificationBell } from "@/features/notification/NotificationBell"
import { useOrgRemovedRealtime } from "@/features/organization/useOrgRemovedRealtime"
import { OrgRail } from "./OrgRail"
import { OrgSidebar } from "./OrgSidebar"

// App Shell แบบ Discord: [rail องค์กร] [sidebar บอร์ด] [เนื้อหา]
//
// ใช้ h-dvh ไม่ใช่ h-screen: บนมือถือ 100vh นับรวมพื้นที่หลัง URL bar
// ของเบราว์เซอร์ → เนื้อหาล้นจอ, dvh (dynamic viewport height) คือพื้นที่เห็นจริง
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  // ถูกนำออกจาก org → ล้าง cache + เด้งออกจากหน้าของ org นั้น (ดูในไฟล์ hook)
  useOrgRemovedRealtime()

  // เปลี่ยนหน้า = ผู้ใช้เลือกปลายทางแล้ว → ปิด drawer ให้อัตโนมัติ
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-dvh flex-col">
      {/* top bar เฉพาะจอเล็ก — จอใหญ่ rail+sidebar ทำหน้าที่นี้แทน */}
      <header className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="hover:bg-accent rounded-md p-2"
          title="เปิดเมนู"
        >
          <Menu className="size-5" />
        </button>
        <Link to="/" className="font-semibold">
          Bootstrapper
        </Link>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </header>

      {/* min-h-0: ปลด default (min-height:auto) ของ flex item — ไม่งั้นเนื้อหา
          ที่สูงเกินจะดันแถวนี้ขยายตาม แทนที่จะ scroll ภายใน main */}
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex">
          <OrgRail />
          <OrgSidebar />
        </div>

        {/* min-w-0 เหตุผลเดียวกันแนวนอน — กันบอร์ดกว้างดัน layout แตก */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* drawer มือถือ: rail+sidebar ชุดเดียวกับเดสก์ท็อป ทับจากซ้าย */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* ฉากหลังมืด — คลิกเพื่อปิด */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex shadow-xl">
            <OrgRail />
            <OrgSidebar />
          </div>
        </div>
      )}
    </div>
  )
}
