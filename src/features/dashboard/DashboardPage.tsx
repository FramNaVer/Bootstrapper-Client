import { useAuth } from "@/features/auth/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

// หน้า placeholder หลัง login — พิสูจน์ว่า auth flow ครบวงจร
// (ต่อไปจะแทนที่ด้วยรายการ organization / board)
export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ยินดีต้อนรับ</CardTitle>
          <CardDescription>
            เข้าสู่ระบบในชื่อ {user?.displayName ?? user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">อีเมล</dt>
            <dd>{user?.email}</dd>
            <dt className="text-muted-foreground">ยืนยันอีเมลแล้ว</dt>
            <dd>{user?.isEmailVerified ? "ใช่" : "ยังไม่ยืนยัน"}</dd>
            <dt className="text-muted-foreground">สิทธิ์</dt>
            <dd>{user?.role}</dd>
          </dl>
          <Button variant="outline" onClick={() => void signOut()}>
            ออกจากระบบ
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
