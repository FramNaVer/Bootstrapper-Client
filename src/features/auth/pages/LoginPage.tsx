import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../api/auth.api"
import { useAuth } from "../AuthContext"
import { getApiErrorMessage } from "@/shared/api/errors"

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
    <div className="center-screen">
      <div className="card">
        <h1>เข้าสู่ระบบ</h1>

        <form onSubmit={onSubmit} className="form">
          <label>
            อีเมล
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            รหัสผ่าน
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {login.isError && (
            <p className="error">
              {getApiErrorMessage(login.error, "เข้าสู่ระบบไม่สำเร็จ")}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={login.isPending}>
            {login.isPending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="divider">หรือ</div>

        <div className="oauth">
          <a className="btn-oauth" href={`${API_URL}/api/v1/auth/google`}>
            เข้าสู่ระบบด้วย Google
          </a>
          <a className="btn-oauth" href={`${API_URL}/api/v1/auth/github`}>
            เข้าสู่ระบบด้วย GitHub
          </a>
        </div>

        <p className="muted">
          ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  )
}
