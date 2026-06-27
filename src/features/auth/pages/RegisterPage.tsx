import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../api/auth.api"
import { getApiErrorMessage } from "@/shared/api/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // ส่งต่อ redirect (เช่นลิงก์รับคำเชิญ) ไปหน้า login หลังสมัครเสร็จ
  const redirect = searchParams.get("redirect")

  const register = useMutation({
    mutationFn: () => authApi.register({ displayName, email, password }),
    onSuccess: () => {
      // backend ส่งอีเมลยืนยัน → ยังไม่ auto-login ให้ไปหน้า login พร้อมแจ้งเตือน
      const suffix = redirect
        ? `&redirect=${encodeURIComponent(redirect)}`
        : ""
      navigate(`/login?registered=1${suffix}`, { replace: true })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    register.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>สมัครสมาชิก</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">ชื่อที่แสดง</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
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
            <div className="grid gap-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
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

            {register.isError && (
              <p className="text-destructive text-sm">
                {getApiErrorMessage(register.error, "สมัครสมาชิกไม่สำเร็จ")}
              </p>
            )}

            <Button type="submit" disabled={register.isPending}>
              {register.isPending ? "กำลังสมัคร…" : "สมัครสมาชิก"}
            </Button>
          </form>

          <p className="text-muted-foreground mt-5 text-center text-sm">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              to={
                redirect
                  ? `/login?redirect=${encodeURIComponent(redirect)}`
                  : "/login"
              }
              className="text-primary underline-offset-4 hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
