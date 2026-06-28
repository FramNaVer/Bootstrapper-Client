import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getSocket } from "@/shared/realtime/socket"

export interface PresenceUser {
  userId: string
  displayName: string | null
  email: string
}

// เข้าห้อง real-time ของบอร์ด:
//  - คนอื่นเปลี่ยนอะไร → refetch ข้อมูลบอร์ดให้สด
//  - คืนรายชื่อ "คนที่กำลังดูบอร์ดนี้" (presence)
export function useBoardRealtime(boardId: string): PresenceUser[] {
  const queryClient = useQueryClient()
  const [presence, setPresence] = useState<PresenceUser[]>([])

  useEffect(() => {
    const socket = getSocket()

    const onChange = () => {
      queryClient.invalidateQueries({ queryKey: ["cards", boardId] })
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] })
      queryClient.invalidateQueries({ queryKey: ["board", boardId] })
      queryClient.invalidateQueries({ queryKey: ["activities", boardId] })
    }
    const onPresence = (users: PresenceUser[]) => setPresence(users)

    const join = () => socket.emit("join-board", boardId)
    join()
    socket.on("connect", join)
    socket.on("board:change", onChange)
    socket.on("board:presence", onPresence)
    socket.io.on("reconnect", onChange) // catch-up หลังเน็ตหลุดแล้วต่อกลับ

    return () => {
      socket.emit("leave-board", boardId)
      socket.off("board:change", onChange)
      socket.off("board:presence", onPresence)
      socket.off("connect", join)
      socket.io.off("reconnect", onChange)
      setPresence([])
    }
  }, [boardId, queryClient])

  return presence
}
