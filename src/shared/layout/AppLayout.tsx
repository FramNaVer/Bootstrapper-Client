import { Link, Outlet } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"

// โครงหน้าหลังล็อกอิน: header (ชื่อแอป + user + logout) แล้วตามด้วยเนื้อหา (Outlet)
export function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-border bg-card/50 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/" className="font-semibold">
            Bootstrapper
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {user?.displayName ?? user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
