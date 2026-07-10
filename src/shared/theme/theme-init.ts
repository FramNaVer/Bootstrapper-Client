// ตั้งธีมทันทีที่ bundle โหลด — ก่อน React render เฟรมแรก
//
// ทำไมไม่ใช้ <script> inline ใน index.html (วิธีคลาสสิกกัน flash):
// CSP ของเราคือ script-src 'self' → inline script โดนบล็อกบน production
// ไฟล์นี้ import เป็นบรรทัดแรกของ main.tsx แทน — ได้ผลเท่ากันสำหรับ SPA
// (ก่อน JS โหลด หน้าเป็น div ว่างอยู่แล้ว ไม่มีธีมผิดให้เห็น)
//
// กติกา: ผู้ใช้เคยเลือกไว้ (localStorage) ชนะ / ไม่เคยเลือก → ตามธีมของ OS
const stored = localStorage.getItem("theme")
if (
  stored === "dark" ||
  (!stored && matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark")
}
