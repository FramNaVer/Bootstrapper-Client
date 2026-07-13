// =============================================================
// Access Token Storage — sessionStorage (P4: refresh อยู่ใน httpOnly cookie แล้ว)
// =============================================================
// ฝั่ง JS เหลือแค่ access token อายุ 15 นาที — refresh token (ของมีค่าจริง
// เพราะอายุ 7 วัน) อยู่ใน httpOnly cookie ที่ JavaScript อ่านไม่ได้เลย
// → ต่อให้โดน XSS โจรได้อย่างมากแค่ access token อายุสั้นของแท็บเดียว
//
// ทำไม sessionStorage ไม่ใช่ localStorage: แยกต่อแท็บและหายเมื่อปิดแท็บ
// ทำไมไม่เก็บใน memory ล้วน: reload แล้วหาย ทุกครั้งที่กด F5 ต้องยิง /refresh
// เพิ่ม latency + เพิ่ม rotation ฟรีๆ — sessionStorage รอด reload พอดี
// =============================================================

const ACCESS_KEY = "accessToken"

export const tokenStorage = {
  getAccess: () => sessionStorage.getItem(ACCESS_KEY),

  setAccess(accessToken: string) {
    sessionStorage.setItem(ACCESS_KEY, accessToken)
  },

  clear() {
    sessionStorage.removeItem(ACCESS_KEY)
    // เก็บกวาดของยุค localStorage (client รุ่นก่อน P4) ทิ้งด้วย
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
  },
}

// token รุ่นเก่าที่ค้างใน localStorage จาก client รุ่นก่อน — หยิบ "ครั้งเดียว"
// เพื่อ migrate เข้าระบบ cookie (ส่งใน body ให้ backend ฝัง cookie ให้) แล้วลบทิ้งทันที
// → ผู้ใช้เดิมไม่โดนเด้งออกตอนอัปเวอร์ชัน
export function takeLegacyRefreshToken(): string | null {
  const legacy = localStorage.getItem("refreshToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("accessToken")
  return legacy
}
