import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { organizationApi } from "../api/organization.api"
import type { DueCard } from "../types"
import { avatarColor } from "@/shared/components/Avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// =============================================================
// ปฏิทินรายเดือน: การ์ดที่มีกำหนดส่งจาก "ทุกบอร์ด" ของ org
// เขียนเองด้วย Date ล้วน — ปฏิทินเดือนต้องการแค่บวกวัน/หา offset
// ไม่คุ้มที่จะลง library (bundle โต + ไม่ได้เรียนรู้อะไร)
// =============================================================

// key ประจำวันแบบ YYYY-MM-DD (เวลา local) — ใช้จับคู่การ์ดเข้าช่องวัน
function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

// "2026-07-10" → "10 กรกฎาคม" (ต่อ T00:00:00 ให้ parse เป็น local กันวันเพี้ยนข้าม timezone)
function keyToLabel(key: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
  })
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

export function OrgCalendar({ orgId }: { orgId: string }) {
  const navigate = useNavigate()
  const todayKey = dateKey(new Date())

  // เดือนที่กำลังแสดง — เก็บเป็น Date ของ "วันแรกของเดือน"
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState<string>(todayKey)

  // ช่องทั้งหมดของ grid: ถอยจากวันที่ 1 ไปหาวันอาทิตย์ แล้วเดินทีละวันจนครบ
  // สัปดาห์สุดท้ายของเดือน (7 คูณจำนวนสัปดาห์ → บางเดือน 35 ช่อง บางเดือน 42)
  const days = useMemo(() => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate() // วันที่ 0 ของเดือนถัดไป = วันสุดท้ายเดือนนี้
    const offset = monthDate.getDay() // วันในสัปดาห์ของวันที่ 1 (0 = อาทิตย์)
    const cells = Math.ceil((offset + daysInMonth) / 7) * 7
    return Array.from(
      { length: cells },
      (_, i) => new Date(year, month, i + 1 - offset)
    )
  }, [monthDate])

  // ขอช่วงเท่าที่ grid แสดงจริง (รวมวันหัวท้ายที่ล้ำเดือนข้างเคียง)
  const dueFrom = dateKey(days[0])
  const dueTo = dateKey(days[days.length - 1])

  const {
    data: cards,
    isLoading,
    isError,
  } = useQuery({
    // dueFrom ระบุ grid ได้ตัวเดียว (dueTo คำนวณจากมัน) แต่ใส่ครบให้อ่านรู้เรื่อง
    queryKey: ["due-cards", orgId, dueFrom, dueTo],
    queryFn: () => organizationApi.listDueCards(orgId, dueFrom, dueTo),
  })

  // จัดกลุ่มการ์ดตามวัน — ใช้ 10 ตัวแรกของ ISO string
  // (ตรงกับที่ช่อง "กำหนดส่ง" ใน modal การ์ดแสดง จะได้เห็นวันเดียวกันเสมอ)
  const byDay = useMemo(() => {
    const grouped: Record<string, DueCard[]> = {}
    for (const c of cards ?? []) {
      const key = c.dueDate.slice(0, 10)
      ;(grouped[key] ??= []).push(c)
    }
    return grouped
  }, [cards])

  const monthLabel = monthDate.toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  })
  const currentMonth = monthDate.getMonth()
  const selectedCards = byDay[selectedKey] ?? []

  function shiftMonth(delta: number) {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  function goToday() {
    const now = new Date()
    setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedKey(todayKey)
  }

  function openCard(card: DueCard) {
    // ?card= → BoardPage เปิด modal การ์ดใบนั้นให้ทันที (deep link)
    navigate(`/org/${orgId}/board/${card.boardId}?card=${card.id}`)
  }

  return (
    <div>
      {/* แถบเลื่อนเดือน */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => shiftMonth(-1)}
            title="เดือนก่อน"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            วันนี้
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => shiftMonth(1)}
            title="เดือนถัดไป"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {isError && (
        <p className="text-destructive mb-3 text-sm">
          โหลดปฏิทินไม่สำเร็จ ลองรีเฟรชอีกครั้ง
        </p>
      )}

      {/* หัวตาราง: ชื่อวัน */}
      <div className="text-muted-foreground grid grid-cols-7 text-center text-xs font-medium">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* ช่องวัน */}
      <div
        className={cn(
          "grid grid-cols-7 overflow-hidden rounded-lg border",
          isLoading && "opacity-60"
        )}
      >
        {days.map((day, i) => {
          const key = dateKey(day)
          const inMonth = day.getMonth() === currentMonth
          const dayCards = byDay[key] ?? []
          const isToday = key === todayKey
          const isSelected = key === selectedKey
          return (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={cn(
                "flex min-h-16 flex-col items-stretch gap-1 p-1 text-left sm:min-h-24",
                // เส้นแบ่งช่อง: เว้นคอลัมน์แรก/แถวแรก (ขอบนอกมีจากกรอบ container แล้ว)
                i % 7 !== 0 && "border-l",
                i >= 7 && "border-t",
                !inMonth && "text-muted-foreground/60 bg-secondary/30",
                isSelected && "bg-accent"
              )}
            >
              <span
                className={cn(
                  "self-start rounded-full px-1.5 py-0.5 text-xs leading-none",
                  isToday && "bg-primary text-primary-foreground font-semibold"
                )}
              >
                {day.getDate()}
              </span>

              {/* จอใหญ่: chip ชื่อการ์ด สีตามบอร์ด — คลิกไปเปิดการ์ดได้เลย */}
              <div className="hidden flex-col gap-0.5 md:flex">
                {dayCards.slice(0, 3).map((c) => (
                  <span
                    key={c.id}
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation() // ไม่ให้ไปนับเป็นการเลือกช่องวัน
                      openCard(c)
                    }}
                    title={`${c.title} — ${c.boardName}`}
                    className="truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white hover:opacity-80"
                    style={{ backgroundColor: avatarColor(c.boardId) }}
                  >
                    {c.title}
                  </span>
                ))}
                {dayCards.length > 3 && (
                  <span className="text-muted-foreground text-[10px]">
                    +{dayCards.length - 3} ใบ
                  </span>
                )}
              </div>

              {/* จอเล็ก: chip กลายเป็นจุดสี (แตะช่องเพื่อดูรายการด้านล่างแทน) */}
              <div className="flex flex-wrap gap-0.5 md:hidden">
                {dayCards.slice(0, 4).map((c) => (
                  <span
                    key={c.id}
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: avatarColor(c.boardId) }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* รายการของวันที่เลือก / คำใบ้เมื่อทั้งเดือนว่าง */}
      {cards && cards.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          เดือนนี้ยังไม่มีการ์ดที่ตั้งกำหนดส่ง — เปิดการ์ดในบอร์ดแล้วตั้ง
          "กำหนดส่ง" การ์ดจะมาโผล่บนปฏิทินนี้
        </p>
      ) : (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold">
            กำหนดส่ง {keyToLabel(selectedKey)}{" "}
            <span className="text-muted-foreground font-normal">
              ({selectedCards.length} ใบ)
            </span>
          </h3>
          {selectedCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              ไม่มีการ์ดที่ครบกำหนดวันนี้
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {selectedCards.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => openCard(c)}
                    className="hover:bg-accent flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: avatarColor(c.boardId) }}
                    />
                    <span className="truncate font-medium">{c.title}</span>
                    {/* เทียบ key ตรงๆ ได้เพราะ YYYY-MM-DD เรียงตามตัวอักษร = เรียงตามเวลา */}
                    {selectedKey < todayKey && (
                      <span className="text-destructive shrink-0 text-xs font-medium">
                        เลยกำหนด
                      </span>
                    )}
                    <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                      {c.boardName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
