import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { useParams } from "react-router-dom"
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { MessageSquare, Send } from "lucide-react"
import { chatApi } from "../api/chat.api"
import { appendMessage, useChatRealtime } from "../useChatRealtime"
import { organizationApi } from "@/features/organization/api/organization.api"
import { Avatar, initials } from "@/shared/components/Avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// เวลาของข้อความ: วันนี้โชว์แค่ HH:mm / วันอื่นเติมวันที่ข้างหน้า
function messageTime(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay
    ? time
    : `${d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} ${time}`
}

export function ChatPage() {
  const { orgId } = useParams() as { orgId: string }
  const queryClient = useQueryClient()

  // ชื่อ org จาก cache เดิม (rail โหลดไว้แล้ว)
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationApi.list,
  })
  const org = organizations?.find((o) => o.id === orgId)

  const history = useInfiniteQuery({
    queryKey: ["messages", orgId],
    queryFn: ({ pageParam }) => chatApi.list(orgId, pageParam),
    initialPageParam: undefined as string | undefined,
    // nextCursor = null (หมดแล้ว) → แปลงเป็น undefined ให้ hasNextPage เป็น false
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  useChatRealtime(orgId)

  // API เก็บใหม่→เก่า (ทุกหน้า) → กลับด้านเป็นเก่า→ใหม่สำหรับวาดบนจอ
  const messages = useMemo(
    () =>
      (history.data?.pages.flatMap((p) => p.messages) ?? []).slice().reverse(),
    [history.data]
  )

  const [body, setBody] = useState("")
  const send = useMutation({
    mutationFn: () => chatApi.send(orgId, body.trim()),
    onSuccess: (message) => {
      setBody("")
      // เสียบจาก response ทันที ไม่รอ echo จาก socket (dedupe กันเบิ้ลให้แล้ว)
      appendMessage(queryClient, orgId, message)
      forceScrollRef.current = true // ส่งเอง = เลื่อนลงล่างเสมอ
    },
    // ไม่ตั้ง meta.silent — ส่งไม่สำเร็จให้ global toast แจ้ง (ไม่มี error UI ในหน้านี้)
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (body.trim() && !send.isPending) send.mutate()
  }

  // ============ การจัดการ scroll — 3 กรณีที่พฤติกรรมต้องต่างกัน ============
  // 1) โหลดครั้งแรก → เลื่อนลงล่างสุด (ข้อความล่าสุด)
  // 2) มีข้อความใหม่ → เลื่อนเฉพาะถ้าเราส่งเอง หรืออยู่ใกล้ก้นจออยู่แล้ว
  //    (กำลังไล่อ่านของเก่าต้องไม่โดนดึงลงมา)
  // 3) โหลดของเก่า (เนื้อหางอก "ด้านบน") → ชดเชย scrollTop ไม่ให้จอกระโดด
  const listRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const forceScrollRef = useRef(false)
  const didInitialScrollRef = useRef(false)
  const prevHeightRef = useRef<number | null>(null)

  function onScroll() {
    const el = listRef.current
    if (!el) return
    nearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  // กรณี 1 + 2
  useEffect(() => {
    const el = listRef.current
    if (!el || messages.length === 0) return
    if (
      !didInitialScrollRef.current ||
      forceScrollRef.current ||
      nearBottomRef.current
    ) {
      el.scrollTop = el.scrollHeight
      didInitialScrollRef.current = true
      forceScrollRef.current = false
    }
  }, [messages.length])

  // กรณี 3: บันทึกความสูงก่อนโหลด แล้วชดเชยหลัง DOM อัปเดต (ก่อน paint)
  function loadOlder() {
    prevHeightRef.current = listRef.current?.scrollHeight ?? null
    void history.fetchNextPage()
  }
  useLayoutEffect(() => {
    const el = listRef.current
    if (el && prevHeightRef.current !== null) {
      el.scrollTop += el.scrollHeight - prevHeightRef.current
      prevHeightRef.current = null
    }
  }, [history.data?.pages.length])

  return (
    <div className="flex h-full flex-col">
      {/* หัวห้อง */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquare className="text-muted-foreground size-4" />
        <h1 className="font-semibold">ห้องแชท</h1>
        <span className="text-muted-foreground truncate text-sm">
          — {org?.name ?? "องค์กร"}
        </span>
      </div>

      {/* ประวัติข้อความ */}
      <div
        ref={listRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {history.hasNextPage && (
          <div className="flex justify-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadOlder}
              disabled={history.isFetchingNextPage}
            >
              {history.isFetchingNextPage
                ? "กำลังโหลด…"
                : "โหลดข้อความเก่ากว่า"}
            </Button>
          </div>
        )}

        {history.isLoading && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            กำลังโหลด…
          </p>
        )}
        {history.isError && (
          <p className="text-destructive py-8 text-center text-sm">
            โหลดแชทไม่สำเร็จ ลองรีเฟรชอีกครั้ง
          </p>
        )}
        {!history.isLoading && !history.isError && messages.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            ยังไม่มีข้อความ — ทักทายทีมของคุณเป็นคนแรกได้เลย 👋
          </p>
        )}

        {messages.map((m, i) => {
          // ข้อความติดกันจากคนเดิมภายใน 5 นาที → ยุบหัว (ชื่อ/avatar) แบบ Discord
          const prev = messages[i - 1]
          const grouped =
            !!prev &&
            prev.authorId === m.authorId &&
            new Date(m.createdAt).getTime() -
              new Date(prev.createdAt).getTime() <
              5 * 60_000

          return (
            <div
              key={m.id}
              className={cn("flex gap-2.5", grouped ? "mt-0.5 pl-[38px]" : "mt-3")}
            >
              {!grouped && (
                <Avatar
                  seed={m.authorId}
                  label={initials(m.authorName, m.authorEmail)}
                  title={m.authorEmail}
                />
              )}
              <div className="min-w-0">
                {!grouped && (
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-semibold">
                      {m.authorName ?? m.authorEmail}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-[11px]">
                      {messageTime(m.createdAt)}
                    </span>
                  </div>
                )}
                {/* whitespace-pre-wrap: เคารพการเว้นบรรทัดที่ผู้ใช้พิมพ์
                    (React escape เนื้อหาให้อยู่แล้ว — ไม่มีความเสี่ยง XSS) */}
                <p className="text-sm break-words whitespace-pre-wrap">
                  {m.body}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* กล่องพิมพ์ */}
      <form onSubmit={onSubmit} className="flex gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="พิมพ์ข้อความ… (Enter เพื่อส่ง)"
          maxLength={2000}
          autoFocus
        />
        <Button type="submit" disabled={!body.trim() || send.isPending}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
