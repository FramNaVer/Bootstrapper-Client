import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { notificationApi } from "./api/notification.api"
import type { AppNotification } from "./types"
import { organizationApi } from "@/features/organization/api/organization.api"
import { getSocket } from "@/shared/realtime/socket"
import { getApiErrorMessage } from "@/shared/api/errors"
import { Button } from "@/components/ui/button"

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return "เมื่อสักครู่"
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชม.ที่แล้ว`
  return `${Math.floor(h / 24)} วันที่แล้ว`
}

export function NotificationBell() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationApi.list,
  })
  const notifications = data?.notifications ?? []
  const unread = data?.unreadCount ?? 0

  // real-time: ถูกเชิญตอนออนไลน์ → กระดิ่งเด้งสด
  useEffect(() => {
    const socket = getSocket()
    const onNew = () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    socket.on("notification:new", onNew)
    return () => {
      socket.off("notification:new", onNew)
    }
  }, [queryClient])

  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const accept = useMutation({
    mutationFn: async (n: AppNotification) => {
      // เส้นทางหลัก: invitationId / fallback: token (notification เก่าก่อนเปลี่ยน payload)
      const res = n.payload?.invitationId
        ? await organizationApi.acceptInvitationById(n.payload.invitationId)
        : await organizationApi.acceptInvitation(n.payload!.token!)
      await notificationApi.markRead(n.id)
      return res
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      setOpen(false)
      navigate(`/org/${res.organizationId}`)
    },
    meta: { silent: true }, // error inline ใน dropdown แล้ว
  })

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) markAll.mutate() // เปิดกระดิ่ง = อ่านแล้ว → เคลียร์ badge
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="hover:bg-secondary relative rounded-md p-2"
        title="การแจ้งเตือน"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="bg-destructive absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* คลิกนอกพื้นที่ → ปิด */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="bg-card absolute right-0 z-50 mt-2 w-80 rounded-lg border shadow-lg">
            <div className="border-b px-4 py-2 text-sm font-semibold">
              การแจ้งเตือน
            </div>

            {accept.isError && (
              <p className="text-destructive px-4 py-2 text-xs">
                {getApiErrorMessage(accept.error, "รับคำเชิญไม่สำเร็จ")}
              </p>
            )}

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                  ยังไม่มีการแจ้งเตือน
                </p>
              )}

              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b px-4 py-3 last:border-0 ${
                    n.readAt ? "" : "bg-accent/40"
                  }`}
                >
                  {n.type === "ORG_INVITE" ? (
                    <>
                      <p className="text-sm">
                        คุณได้รับคำเชิญเข้าร่วม{" "}
                        <span className="font-medium">
                          {n.payload?.organizationName ?? "องค์กร"}
                        </span>
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          {timeAgo(n.createdAt)}
                        </span>
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs"
                          disabled={
                            accept.isPending ||
                            (!n.payload?.invitationId && !n.payload?.token)
                          }
                          onClick={() => accept.mutate(n)}
                        >
                          เข้าร่วม
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm">{n.type}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
