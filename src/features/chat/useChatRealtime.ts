import { useEffect } from "react"
import {
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query"
import { getSocket } from "@/shared/realtime/socket"
import type { Message, MessagePage } from "./types"

// เสียบข้อความใหม่เข้า cache ของ useInfiniteQuery โดยตรง (หน้าแรก = หน้าใหม่สุด)
//
// ข้อความหนึ่งใบมาถึงเราได้ "สองทาง": response ของ POST (คนส่งเอง) และ
// echo จาก socket (ทุกคนในห้องรวมคนส่ง) → dedupe ด้วย id กันข้อความเบิ้ล
// ทำไมไม่ตัด echo ฝั่ง server: แท็บอื่นของคนส่งเองก็ต้องได้ข้อความด้วย
export function appendMessage(
  queryClient: QueryClient,
  orgId: string,
  message: Message
) {
  queryClient.setQueryData<InfiniteData<MessagePage>>(
    ["messages", orgId],
    (old) => {
      if (!old || old.pages.length === 0) return old
      const exists = old.pages.some((p) =>
        p.messages.some((m) => m.id === message.id)
      )
      if (exists) return old
      const [first, ...rest] = old.pages
      return {
        ...old,
        pages: [{ ...first, messages: [message, ...first.messages] }, ...rest],
      }
    }
  )
}

// เข้าห้องแชทของ org: ฟัง chat:new (push ตัวข้อความจริง — append ได้ทันที
// ไม่ต้องยิง API ซ้ำ ต่างจาก board:change ที่เป็นสัญญาณ refetch)
export function useChatRealtime(orgId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()

    // append เข้า cache ของ org ตามตัวข้อความเอง — ถ้า cache นั้นไม่มี (ยังไม่เคยเปิด) = no-op
    const onNew = (message: Message) =>
      appendMessage(queryClient, message.organizationId, message)

    // เน็ตหลุดแล้วต่อกลับ: ข้อความช่วงที่หลุดหายไปจาก cache → refetch ประวัติ
    const catchUp = () =>
      queryClient.invalidateQueries({ queryKey: ["messages", orgId] })

    const join = () => socket.emit("join-org", orgId)
    join()
    socket.on("connect", join) // reconnect แล้วต้อง join ห้องใหม่เสมอ
    socket.on("chat:new", onNew)
    socket.io.on("reconnect", catchUp)

    return () => {
      socket.emit("leave-org", orgId)
      socket.off("connect", join)
      socket.off("chat:new", onNew)
      socket.io.off("reconnect", catchUp)
    }
  }, [orgId, queryClient])
}
