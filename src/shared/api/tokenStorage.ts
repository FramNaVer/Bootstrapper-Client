// =============================================================
// Token Storage — เก็บ access/refresh token ใน localStorage
// =============================================================
// ทำไม localStorage? ง่ายและพอสำหรับโปรเจคนี้
// ข้อแลกเปลี่ยน: ถ้าเว็บโดน XSS โจรอ่าน token ได้ → ทางที่ปลอดภัยกว่าคือ
// httpOnly cookie (JS อ่านไม่ได้) แต่ backend ต้องเซ็ต cookie ให้ ซึ่งเป็นงานเพิ่ม
// → บันทึกไว้เป็นจุดอัปเกรดในอนาคต
//
// แยกไฟล์นี้ออกมาเพราะ axios (นอก React) ก็ต้องอ่าน token ด้วย
// ทำให้เป็น "แหล่งความจริงเดียว" ของ token ที่ทั้ง React และ axios ใช้ร่วมกัน
// =============================================================

const ACCESS_KEY = "accessToken"
const REFRESH_KEY = "refreshToken"

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),

  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  },

  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
