import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// รวม class ของ Tailwind อย่างปลอดภัย — clsx รวม conditional, twMerge ตัด class ที่ชนกัน
// (เช่น "px-2 px-4" → "px-4") เป็น helper มาตรฐานที่ shadcn ทุก component ใช้
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
