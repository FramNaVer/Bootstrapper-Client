import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../api/auth.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ขอลิงก์รีเซ็ตรหัสผ่านทางอีเมล
// สังเกต: หลังส่งเราแสดงข้อความเดียวกันเสมอ ไม่ว่าอีเมลจะมีในระบบหรือไม่
// — สอดคล้องกับ backend (กัน user enumeration ต้องกันทั้งสองชั้น)
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")

  const request = useMutation({
    mutationFn: () => authApi.requestPasswordReset(email),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    request.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ลืมรหัสผ่าน</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {request.isSuccess ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm">
                ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว
                — เช็คกล่องจดหมาย (และถังสแปม) ได้เลย
              </p>
              <p className="text-muted-foreground text-xs">
                ลิงก์มีอายุ 1 ชั่วโมง ถ้าไม่ได้รับ ลองส่งใหม่อีกครั้งได้
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm">
                กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้
              </p>
              <div className="grid gap-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" disabled={request.isPending}>
                {request.isPending ? "กำลังส่ง…" : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
              </Button>
            </form>
          )}

          <p className="text-muted-foreground text-center text-sm">
            <Link
              to="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
