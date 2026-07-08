import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../api/auth.api"
import { useAuth } from "../AuthContext"
import { getApiErrorMessage, getApiErrorCode } from "@/shared/api/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const API_URL = import.meta.env.VITE_API_URL

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signInWithSession } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // กลับไปหน้าที่ตั้งใจจะไป (เช่นลิงก์รับคำเชิญ) — รับเฉพาะ path ภายใน กัน open-redirect
  const redirect = searchParams.get("redirect")
  const dest = redirect && redirect.startsWith("/") ? redirect : "/"

  // มาจากหน้าสมัครสมาชิก → แจ้งให้ไปเช็คเมลยืนยันก่อน
  const justRegistered = searchParams.get("registered") === "1"

  const login = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (session) => {
      signInWithSession(session)
      navigate(dest, { replace: true })
    },
  })

  // login โดน 403 EMAIL_NOT_VERIFIED → แสดง UI เฉพาะ + ปุ่มขอเมลยืนยันใหม่
  const notVerified = getApiErrorCode(login.error) === "EMAIL_NOT_VERIFIED"

  const resend = useMutation({
    mutationFn: () => authApi.resendVerification(email),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    resend.reset() // เริ่ม login รอบใหม่ = ล้างสถานะ "ส่งเมลแล้ว" รอบก่อน
    login.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {justRegistered && (
            <div className="rounded-md border border-green-600/30 bg-green-500/10 p-3 text-sm">
              สมัครสำเร็จ! เราส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว
              กรุณากดยืนยันในเมลก่อนเข้าสู่ระบบ
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
                autoComplete="current-password"
              />
            </div>

            {login.isError && !notVerified && (
              <p className="text-destructive text-sm">
                {getApiErrorMessage(login.error, "เข้าสู่ระบบไม่สำเร็จ")}
              </p>
            )}

            {notVerified && (
              <div className="bg-accent/40 flex flex-col gap-2 rounded-md border p-3 text-sm">
                <p>
                  บัญชีนี้ยังไม่ได้ยืนยันอีเมล —
                  กดลิงก์ในเมลที่เราส่งให้ก่อนเข้าสู่ระบบ
                </p>
                {resend.isSuccess ? (
                  <p className="text-muted-foreground text-xs">
                    ส่งเมลยืนยันใหม่แล้ว เช็คกล่องจดหมาย (และถังสแปม)
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resend.isPending}
                    onClick={() => resend.mutate()}
                  >
                    {resend.isPending ? "กำลังส่ง…" : "ส่งเมลยืนยันอีกครั้ง"}
                  </Button>
                )}
              </div>
            )}

            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="bg-border h-px flex-1" />
            หรือ
            <span className="bg-border h-px flex-1" />
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild>
              <a href={`${API_URL}/api/v1/auth/google`}>เข้าสู่ระบบด้วย Google</a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`${API_URL}/api/v1/auth/github`}>เข้าสู่ระบบด้วย GitHub</a>
            </Button>
          </div>

          <p className="text-muted-foreground text-center text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link
              to={
                redirect
                  ? `/register?redirect=${encodeURIComponent(redirect)}`
                  : "/register"
              }
              className="text-primary underline-offset-4 hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
