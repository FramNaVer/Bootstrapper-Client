import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSocket } from "@/shared/realtime/socket"

// ฟังสัญญาณ "ถูกนำออกจาก org" (server เตะออกจากห้อง socket ให้แล้ว —
// hook นี้คือฝั่ง UI): ล้าง cache ของ org นั้น และถ้ากำลังเปิดหน้าใต้ org นั้นอยู่
// ให้พากลับหน้าแรก — สิทธิ์ REST ถูกตัดไปแล้ว ปล่อยค้างไว้จะเจอ 403 ทุก refetch
//
// mount ครั้งเดียวที่ AppLayout (โครงของทุกหน้าหลัง login)
export function useOrgRemovedRealtime() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    const socket = getSocket()

    const onRemoved = ({ organizationId }: { organizationId: string }) => {
      // รายการ org ต้อง refetch (org ที่ถูกเตะจะหายจาก rail/หน้าแรก)
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      // ข้อมูลใต้ org นั้น (members/messages/due-cards ฯลฯ ที่ key มี orgId)
      // "ทิ้ง" ไม่ใช่ invalidate — invalidate จะสั่ง refetch แล้วเจอ 403 ฟรีๆ
      queryClient.removeQueries({
        predicate: (q) => q.queryKey.includes(organizationId),
      })

      // อ่าน path ตรงจาก window แทน useLocation — ไม่ต้อง re-subscribe socket
      // ทุกครั้งที่เปลี่ยนหน้า (handler ต้องการค่า ณ วินาทีที่ event มาเท่านั้น)
      if (window.location.pathname.startsWith(`/org/${organizationId}`)) {
        toast.info("คุณถูกนำออกจากองค์กรนี้แล้ว")
        navigate("/", { replace: true })
      }
    }

    socket.on("org:removed", onRemoved)
    return () => {
      socket.off("org:removed", onRemoved)
    }
  }, [queryClient, navigate])
}
