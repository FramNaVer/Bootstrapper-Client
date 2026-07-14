import { io, type Socket } from "socket.io-client"
import { tokenStorage } from "../api/tokenStorage"
import { refreshSession } from "../api/client"

// socket ตัวเดียวทั้งแอป (lazy) — เชื่อมต่อตอนใช้ครั้งแรก
// auth เป็นฟังก์ชัน → การเชื่อมต่อแต่ละครั้งหยิบ token ล่าสุดจาก storage เสมอ
let socket: Socket | null = null

// --- กู้ connection หลังถูก server ปฏิเสธ (token หมดอายุ) ---
// socket.io reconnect เองเฉพาะปัญหา network (ตอนนั้น socket.active = true)
// แต่ถ้า auth middleware ฝั่ง server ปฏิเสธ → active = false = "ยอมแพ้ถาวร"
// เคสคลาสสิก: พับจอเกิน 15 นาที token หมดอายุ ตื่นมา realtime เงียบทั้งแอป
// (แชท/presence ไม่ขยับ) จนกว่าจะกด F5 → ต้อง refresh token แล้วสั่งต่อใหม่เอง
let recovering = false
let recoverAttempts = 0
// กันวนไม่รู้จบถ้า server ยังปฏิเสธแม้ได้ token ใหม่ (นาฬิกาเพี้ยน/บั๊กฝั่ง server)
const MAX_RECOVER_ATTEMPTS = 3

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      auth: (cb) => cb({ token: tokenStorage.getAccess() ?? "" }),
    })

    // ต่อสำเร็จ = token ใช้ได้ → คืนโควต้ากู้ (เผื่อพับจอรอบถัดไป)
    socket.on("connect", () => {
      recoverAttempts = 0
    })

    socket.on("connect_error", async () => {
      // active = true → ปัญหา network, socket.io กำลัง retry เองอยู่ ไม่ต้องยุ่ง
      if (!socket || socket.active || recovering) return
      if (recoverAttempts >= MAX_RECOVER_ATTEMPTS) return

      recovering = true
      recoverAttempts++
      try {
        await refreshSession() // access token ใหม่ลง sessionStorage
        socket.connect() // auth callback หยิบ token ล่าสุดให้เองตอนต่อ
      } catch {
        // refresh ถูกปฏิเสธ = session หมดจริง — ไม่ทำอะไรที่นี่ ปล่อยให้
        // interceptor ฝั่ง REST เป็นคนพาไปหน้า login (จุดจัดการ session มีที่เดียว)
      } finally {
        recovering = false
      }
    })
  }
  return socket
}
