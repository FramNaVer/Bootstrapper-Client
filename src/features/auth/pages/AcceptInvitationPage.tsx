import { useEffect, useRef } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { organizationApi } from "@/features/organization/api/organization.api"
import { useAuth } from "../AuthContext"
import { getApiErrorMessage } from "@/shared/api/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const { status } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fired = useRef(false)

  const accept = useMutation({
    mutationFn: () => organizationApi.acceptInvitation(token!),
    onSuccess: () => {
      // org ใหม่โผล่ในรายการ
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
    },
  })

  // login อยู่แล้ว + มี token → ยิงรับคำเชิญครั้งเดียว (ref กัน strict-mode ยิงซ้ำ)
  useEffect(() => {
    if (status === "authenticated" && token && !fired.current) {
      fired.current = true
      accept.mutate()
    }
  }, [status, token, accept])

  // ลิงก์กลับมาหน้านี้หลัง login/สมัคร (เก็บ token ไว้)
  const here = `/accept-invitation${token ? `?token=${token}` : ""}`
  const redirectParam = encodeURIComponent(here)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>รับคำเชิญเข้าร่วมองค์กร</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!token ? (
            <p className="text-destructive text-sm">
              ลิงก์คำเชิญไม่ถูกต้อง (ไม่พบ token)
            </p>
          ) : status === "loading" ? (
            <p className="text-muted-foreground text-sm">กำลังโหลด…</p>
          ) : status === "unauthenticated" ? (
            <>
              <p className="text-muted-foreground text-sm">
                กรุณาเข้าสู่ระบบด้วย
                <span className="text-foreground font-medium">
                  อีเมลที่ได้รับคำเชิญ
                </span>
                ก่อน แล้วระบบจะพากลับมารับคำเชิญให้อัตโนมัติ
              </p>
              <Button asChild>
                <Link to={`/login?redirect=${redirectParam}`}>เข้าสู่ระบบ</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/register?redirect=${redirectParam}`}>
                  สมัครสมาชิก
                </Link>
              </Button>
            </>
          ) : accept.isSuccess ? (
            <>
              <p className="text-sm">เข้าร่วมองค์กรสำเร็จ!</p>
              <Button
                onClick={() => navigate(`/org/${accept.data.organizationId}`)}
              >
                ไปที่องค์กร
              </Button>
            </>
          ) : accept.isError ? (
            <>
              <p className="text-destructive text-sm">
                {getApiErrorMessage(accept.error, "รับคำเชิญไม่สำเร็จ")}
              </p>
              <p className="text-muted-foreground text-xs">
                คำเชิญอาจหมดอายุ ถูกยกเลิก หรืออีเมลที่ล็อกอินไม่ตรงกับที่ถูกเชิญ
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                ไปหน้าแรก
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">กำลังเข้าร่วม…</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
