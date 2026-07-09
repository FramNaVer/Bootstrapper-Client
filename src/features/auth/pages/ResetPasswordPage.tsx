import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../api/auth.api"
import { getApiErrorMessage } from "@/shared/api/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ปลายทางของลิงก์ในเมลรีเซ็ตรหัสผ่าน: /reset-password?token=...
// ตั้งรหัสใหม่สำเร็จ → backend ปิดทุก session เก่า → ต้อง login ใหม่ทุกอุปกรณ์
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [mismatch, setMismatch] = useState(false)

  const reset = useMutation({
    mutationFn: () => authApi.resetPassword(token!, password),
    meta: { silent: true }, // error inline ในฟอร์มแล้ว
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    // เช็คสองช่องตรงกันก่อนยิง — กันพิมพ์รหัสใหม่ผิดโดยไม่รู้ตัว
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    reset.mutate()
  }

  // ไม่มี token ใน URL = ลิงก์เสีย — ไม่ต้องโชว์ฟอร์มให้เสียเวลา
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>ลิงก์ไม่ถูกต้อง</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              ไม่พบ token ในลิงก์ — ลองขอลิงก์รีเซ็ตใหม่อีกครั้ง
            </p>
            <Button asChild variant="outline">
              <Link to="/forgot-password">ขอลิงก์ใหม่</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (reset.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>ตั้งรหัสผ่านใหม่สำเร็จ ✓</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              ทุกอุปกรณ์ถูกออกจากระบบแล้วเพื่อความปลอดภัย —
              เข้าสู่ระบบด้วยรหัสใหม่ได้เลย
            </p>
            <Button asChild>
              <Link to="/login">ไปหน้าเข้าสู่ระบบ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ตั้งรหัสผ่านใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">รหัสผ่านใหม่</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {mismatch && (
              <p className="text-destructive text-sm">
                รหัสผ่านสองช่องไม่ตรงกัน
              </p>
            )}

            {reset.isError && (
              <div className="flex flex-col gap-1">
                <p className="text-destructive text-sm">
                  {getApiErrorMessage(
                    reset.error,
                    "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว"
                  )}
                </p>
                <Link
                  to="/forgot-password"
                  className="text-primary text-xs underline-offset-4 hover:underline"
                >
                  ขอลิงก์ใหม่อีกครั้ง
                </Link>
              </div>
            )}

            <Button type="submit" disabled={reset.isPending}>
              {reset.isPending ? "กำลังบันทึก…" : "ตั้งรหัสผ่านใหม่"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
