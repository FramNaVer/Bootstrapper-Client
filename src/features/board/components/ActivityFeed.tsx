import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { boardApi } from "../api/board.api"
import type { Activity, ActivityAction } from "../types"
import { Avatar, initials } from "./Avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

const ICON: Record<ActivityAction, string> = {
  CARD_CREATED: "➕",
  CARD_MOVED: "➡️",
  CARD_UPDATED: "✏️",
  CARD_DELETED: "🗑",
  COMMENT_ADDED: "💬",
  MEMBER_ASSIGNED: "👤",
  LIST_CREATED: "📋",
  LIST_RENAMED: "✏️",
  LIST_DELETED: "🗑",
}

// แปลง action + payload เป็นข้อความอ่านง่าย (การ์ดใช้ title, คอลัมน์ใช้ name)
function describe(a: Activity): string {
  const title = a.payload?.title
  const name = a.payload?.name
  switch (a.action) {
    case "CARD_CREATED":
      return `สร้างการ์ด “${title}”`
    case "CARD_UPDATED":
      return `แก้ไขการ์ด “${title}”`
    case "CARD_DELETED":
      return `ลบการ์ด “${title}”`
    case "CARD_MOVED":
      return "ย้ายการ์ดข้ามคอลัมน์"
    case "COMMENT_ADDED":
      return "เพิ่มความเห็นในการ์ด"
    case "MEMBER_ASSIGNED":
      return "มอบหมายงานให้สมาชิก"
    case "LIST_CREATED":
      return `สร้างคอลัมน์ “${name}”`
    case "LIST_RENAMED":
      return `เปลี่ยนชื่อคอลัมน์เป็น “${name}”`
    case "LIST_DELETED":
      return `ลบคอลัมน์ “${name}”`
    default:
      return a.action
  }
}

// เวลาแบบสัมพัทธ์ "x นาทีที่แล้ว"
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "เมื่อสักครู่"
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชม.ที่แล้ว`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} วันที่แล้ว`
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  })
}

export function ActivityFeed({
  orgId,
  boardId,
}: {
  orgId: string
  boardId: string
}) {
  const [open, setOpen] = useState(false)

  const activities = useQuery({
    queryKey: ["activities", boardId],
    queryFn: () => boardApi.listActivities(orgId, boardId),
    enabled: open,
    staleTime: 0, // เปิดทีไรดึงล่าสุดเสมอ
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          ประวัติ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ประวัติการเปลี่ยนแปลง</DialogTitle>
        </DialogHeader>

        {activities.isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : activities.data && activities.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">ยังไม่มีความเคลื่อนไหว</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(activities.data ?? []).map((a) => (
              <li key={a.id} className="flex gap-2.5">
                <Avatar
                  seed={a.actorId}
                  label={initials(a.actorName, a.actorEmail)}
                  title={a.actorName ?? a.actorEmail}
                />
                <div className="flex-1 text-sm leading-snug">
                  <span className="font-medium">
                    {a.actorName ?? a.actorEmail}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {ICON[a.action]} {describe(a)}
                  </span>
                  <div className="text-muted-foreground text-xs">
                    {timeAgo(a.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
