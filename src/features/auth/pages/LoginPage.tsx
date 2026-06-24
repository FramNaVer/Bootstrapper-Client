import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../api/auth.api"
import { useAuth } from "../AuthContext"
import { getApiErrorMessage } from "@/shared/api/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const API_URL = import.meta.env.VITE_API_URL

export function LoginPage() {
  const navigate = useNavigate()
  const { signInWithSession } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const login = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (session) => {
      signInWithSession(session)
      navigate("/", { replace: true })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    login.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
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

            {login.isError && (
              <p className="text-destructive text-sm">
                {getApiErrorMessage(login.error, "เข้าสู่ระบบไม่สำเร็จ")}
              </p>
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
              to="/register"
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
