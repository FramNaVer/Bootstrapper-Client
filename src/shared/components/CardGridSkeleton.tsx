import { Skeleton } from "@/components/ui/skeleton"

// skeleton รูปร่างเหมือน grid การ์ดจริง → พอข้อมูลมา การ์ดแทนที่ตำแหน่งเดิม ไม่กระตุก
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  )
}
