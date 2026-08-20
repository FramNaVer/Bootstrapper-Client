// สถานะ presence จาก lastSeenAt (heartbeat ฝั่ง client ยิงทุก 60s)
// online = เห็นล่าสุดภายใน 2 นาที → คนที่เปิดแอปอยู่ (heartbeat ยังมา) จะเข้าเกณฑ์เสมอ
const ONLINE_THRESHOLD_MS = 2 * 60_000

export function isOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS
}

// "เห็นล่าสุดเมื่อ" แบบสั้นภาษาไทย (ใช้ตอนออฟไลน์)
export function lastSeenLabel(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "ยังไม่เคยออนไลน์"
  const diff = Date.now() - new Date(lastSeenAt).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "เมื่อสักครู่"
  if (min < 60) return `${min} นาทีที่แล้ว`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} ชม.ที่แล้ว`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} วันที่แล้ว`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo} เดือนที่แล้ว`
  return `${Math.floor(mo / 12)} ปีที่แล้ว`
}
