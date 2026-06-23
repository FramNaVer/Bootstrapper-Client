import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../AuthContext"

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
      <div className="center-screen">
        <div className="card">
          <h1>เข้าสู่ระบบไม่สำเร็จ</h1>
          <p className="muted">ลิงก์ไม่ถูกต้องหรือหมดอายุ</p>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    )
  }

  return <div className="center-screen">กำลังเข้าสู่ระบบ…</div>
}
