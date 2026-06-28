import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getSocket } from "@/shared/realtime/socket"

// เข้าห้อง real-time ของบอร์ด: มีคนอื่นเปลี่ยนอะไร → refetch ข้อมูลบอร์ดให้สด
export function useBoardRealtime(boardId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()

    // ได้สัญญาณว่าบอร์ดเปลี่ยน → invalidate ให้ TanStack Query ดึงใหม่
    const onChange = () => {
      queryClient.invalidateQueries({ queryKey: ["cards", boardId] })
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] })
      queryClient.invalidateQueries({ queryKey: ["board", boardId] })
      queryClient.invalidateQueries({ queryKey: ["activities", boardId] })
    }

    // join ทันที + join ใหม่ทุกครั้งที่ reconnect (token/เน็ตหลุดแล้วต่อกลับ)
    const join = () => socket.emit("join-board", boardId)
    join()
    socket.on("connect", join)
    socket.on("board:change", onChange)

    // หลัง reconnect สำเร็จ → ดึงข้อมูลใหม่รอบนึง กัน event ที่พลาดตอนเน็ตหลุด
    socket.io.on("reconnect", onChange)

    return () => {
      socket.emit("leave-board", boardId)
      socket.off("board:change", onChange)
      socket.off("connect", join)
      socket.io.off("reconnect", onChange)
    }
  }, [boardId, queryClient])
}
