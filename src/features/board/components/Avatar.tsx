import { cn } from "@/lib/utils"

// ตัวอักษรย่อสำหรับ avatar — กันพังถ้าข้อมูลขาด (เช่น backend เก่ายังไม่ส่ง email)
export function initials(
  name: string | null | undefined,
  email: string | undefined
): string {
  const base = name?.trim() || email || "?"
  return base.slice(0, 2).toUpperCase()
}

// สีพื้น avatar คงที่ตาม seed (ให้คนเดิมสีเดิมเสมอ)
export function avatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h)
  return `hsl(${Math.abs(h) % 360} 55% 45%)`
}

export function Avatar({
  seed,
  label,
  title,
  small,
}: {
  seed: string
  label: string
  title?: string
  small?: boolean
}) {
  return (
    <span
      title={title}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        small ? "size-5 text-[10px]" : "size-7 text-xs"
      )}
      style={{ backgroundColor: avatarColor(seed) }}
    >
      {label}
    </span>
  )
}
