import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// โครงร่วมของหน้า auth (login/register/…) — โลโก้ + tab สลับ + พื้น cream + ลายจุด
// พื้น cream อยู่ที่นี่ ไม่ไปแตะ --background กลาง → กระทบเฉพาะหน้า auth ตามที่ตั้งใจ
// dark mode: กลับไปใช้พื้นมืดของ token กลาง (cream ไม่เข้ากับพื้นมืด)

type AuthTab = "login" | "register"

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-lg font-bold">
        B
      </div>
      <span className="text-lg font-semibold tracking-tight">Bootstrapper</span>
    </div>
  )
}

function AuthTabs({
  active,
  redirect,
}: {
  active: AuthTab
  redirect?: string | null
}) {
  // แนบ redirect ไปกับทั้งสอง tab เพื่อไม่หลุด flow (เช่นลิงก์รับคำเชิญ)
  const q = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""
  const tab = (to: string, label: string, isActive: boolean) => (
    <Link
      to={to}
      className={cn(
        "rounded-md px-3 py-2 text-center text-sm font-medium transition-colors",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  )
  return (
    <div className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1">
      {tab(`/login${q}`, "เข้าสู่ระบบ", active === "login")}
      {tab(`/register${q}`, "สมัครสมาชิก", active === "register")}
    </div>
  )
}

export function AuthShell({
  active,
  title,
  subtitle,
  redirect,
  children,
}: {
  active: AuthTab
  title: string
  subtitle?: string
  redirect?: string | null
  children: ReactNode
}) {
  return (
    <div className="bg-auth relative flex min-h-screen items-center justify-center p-6">
      {/* ลายจุดจางๆ — ตกแต่งพื้นหลัง ไม่รับคลิก */}
      <div aria-hidden className="auth-dots pointer-events-none absolute inset-0" />

      <div className="relative z-10 w-full max-w-sm">
        <Card className="rounded-2xl shadow-xl">
          <CardHeader className="gap-4">
            <BrandLogo />
            <AuthTabs active={active} redirect={redirect} />
            <div className="grid gap-1">
              <CardTitle className="text-2xl">{title}</CardTitle>
              {subtitle && (
                <p className="text-muted-foreground text-sm">{subtitle}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}
