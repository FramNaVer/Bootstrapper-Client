import { AxiosError } from "axios"

// แกะข้อความ error จากรูปแบบ response ของ backend: { error: { message } }
export function getApiErrorMessage(
  error: unknown,
  fallback = "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง"
): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.error?.message ?? fallback
  }
  return fallback
}

// แกะ error code (เช่น EMAIL_NOT_VERIFIED) — ใช้แยกเคสเพื่อแสดง UI เฉพาะ
// เทียบด้วย code เสถียรกว่าเทียบข้อความ (ข้อความเปลี่ยนคำได้ code คือสัญญา)
export function getApiErrorCode(error: unknown): string | null {
  if (error instanceof AxiosError) {
    return error.response?.data?.error?.code ?? null
  }
  return null
}
