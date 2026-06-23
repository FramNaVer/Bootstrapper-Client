import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../api/auth.api"
import { getApiErrorMessage } from "@/shared/api/errors"

export function RegisterPage() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const register = useMutation({
    mutationFn: () => authApi.register({ displayName, email, password }),
    onSuccess: () => {
      // backend ส่งอีเมลยืนยัน → ยังไม่ auto-login ให้ไปหน้า login พร้อมแจ้งเตือน
      navigate("/login?registered=1", { replace: true })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    register.mutate()
  }

  return (
    <div className="center-screen">
      <div className="card">
        <h1>สมัครสมาชิก</h1>

        <form onSubmit={onSubmit} className="form">
          <label>
            ชื่อที่แสดง
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </label>
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
              autoComplete="new-password"
              minLength={8}
            />
          </label>

          {register.isError && (
            <p className="error">
              {getApiErrorMessage(register.error, "สมัครสมาชิกไม่สำเร็จ")}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={register.isPending}
          >
            {register.isPending ? "กำลังสมัคร…" : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="muted">
          มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  )
}
