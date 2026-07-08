import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ปลายทางที่ backend redirect กลับมาหลัง OAuth สำเร็จ:
//   /auth/callback#accessToken=...&refreshToken=...
// เราอ่าน token จาก hash (#...) เก็บลง storage แล้วดึง /me เพื่อ login
export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { hydrateFromTokens } = useAuth()
  const [error, setError] = useState(false)
  // กัน effect ทำงานซ้ำ (React 18 StrictMode เรียก effect 2 รอบใน dev)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const params = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = params.get("accessToken")
    const refreshToken = params.get("refreshToken")

    // ล้าง token ออกจาก URL ทันทีที่อ่านเข้าตัวแปรแล้ว — ไม่ให้ค้างใน
    // address bar / browser history (เส้นทางสำเร็จมี navigate แทน entry ให้อยู่แล้ว
    // แต่เส้นทาง error จะค้างถ้าไม่ล้างตรงนี้)
    window.history.replaceState(null, "", window.location.pathname)

    if (!accessToken || !refreshToken) {
      setError(true)
      return
    }

    hydrateFromTokens(accessToken, refreshToken)
      .then(() => navigate("/", { replace: true }))
      .catch(() => setError(true))
  }, [hydrateFromTokens, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>เข้าสู่ระบบไม่สำเร็จ</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              ลิงก์ไม่ถูกต้องหรือหมดอายุ
            </p>
            <Button onClick={() => navigate("/login")}>
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="text-muted-foreground flex min-h-screen items-center justify-center">
      กำลังเข้าสู่ระบบ…
    </div>
  )
}
