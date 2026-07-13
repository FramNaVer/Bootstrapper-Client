import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ปลายทางที่ backend redirect กลับมาหลัง OAuth สำเร็จ
//
// P4: refresh token มาเป็น httpOnly cookie ตั้งแต่ตอน redirect แล้ว —
// หน้านี้แค่เรียก /refresh (cookie → access token) แล้วดึง /me
// token ใน hash (ที่ backend ยังส่งช่วงเปลี่ยนผ่านให้ client รุ่นเดิม)
// ถูก "ล้างทิ้งโดยไม่อ่าน" — พอถึงขั้น contract URL จะสะอาดตั้งแต่ต้นทาง
export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { hydrateFromOAuth } = useAuth()
  const [error, setError] = useState(false)
  // กัน effect ทำงานซ้ำ (React 18 StrictMode เรียก effect 2 รอบใน dev)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    // ล้าง token ออกจาก URL ทันที — ไม่ให้ค้างใน address bar / history
    window.history.replaceState(null, "", window.location.pathname)

    hydrateFromOAuth()
      .then(() => navigate("/", { replace: true }))
      .catch(() => setError(true))
  }, [hydrateFromOAuth, navigate])

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
