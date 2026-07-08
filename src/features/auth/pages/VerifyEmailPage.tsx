import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { authApi } from "../api/auth.api"
import { getApiErrorMessage } from "@/shared/api/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ปลายทางของลิงก์ในเมลยืนยัน: /verify-email?token=...
// เปิดปุ๊บยิง POST /auth/verify-email ให้เลย (ไม่ต้องให้ผู้ใช้กดอะไรเพิ่ม)
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  )
  const [errorMessage, setErrorMessage] = useState("")
  // กัน effect ยิงซ้ำ (React 18 StrictMode) — token เป็น single-use
  // ถ้ายิงรอบสองจะโดน "already used" ทั้งที่รอบแรกสำเร็จแล้ว
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const token = searchParams.get("token")
    if (!token) {
      setErrorMessage("ลิงก์ไม่ถูกต้อง — ไม่พบ token")
      setStatus("error")
      return
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setErrorMessage(
          getApiErrorMessage(err, "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว")
        )
        setStatus("error")
      })
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        {status === "verifying" && (
          <CardContent className="text-muted-foreground py-10">
            กำลังยืนยันอีเมล…
          </CardContent>
        )}

        {status === "success" && (
          <>
            <CardHeader>
              <CardTitle>ยืนยันอีเมลสำเร็จ ✓</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm">
                บัญชีของคุณพร้อมใช้งานแล้ว เข้าสู่ระบบได้เลย
              </p>
              <Button asChild>
                <Link to="/login">ไปหน้าเข้าสู่ระบบ</Link>
              </Button>
            </CardContent>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader>
              <CardTitle>ยืนยันอีเมลไม่สำเร็จ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
              <p className="text-muted-foreground text-sm">
                ขอลิงก์ใหม่ได้จากหน้าเข้าสู่ระบบ — ลอง login
                แล้วระบบจะมีปุ่มส่งเมลยืนยันอีกครั้งให้
              </p>
              <Button asChild variant="outline">
                <Link to="/login">ไปหน้าเข้าสู่ระบบ</Link>
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
