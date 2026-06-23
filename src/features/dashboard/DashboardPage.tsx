import { useAuth } from "@/features/auth/AuthContext"

// หน้า placeholder หลัง login — พิสูจน์ว่า auth flow ครบวงจร
// (ต่อไปจะแทนที่ด้วยรายการ organization / board)
export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="center-screen">
      <div className="card">
        <h1>ยินดีต้อนรับ 👋</h1>
        <p>
          เข้าสู่ระบบในชื่อ <strong>{user?.displayName ?? user?.email}</strong>
        </p>
        <dl className="info">
          <dt>อีเมล</dt>
          <dd>{user?.email}</dd>
          <dt>ยืนยันอีเมลแล้ว</dt>
          <dd>{user?.isEmailVerified ? "ใช่" : "ยังไม่ยืนยัน"}</dd>
          <dt>สิทธิ์</dt>
          <dd>{user?.role}</dd>
        </dl>
        <button className="btn-primary" onClick={() => void signOut()}>
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}
