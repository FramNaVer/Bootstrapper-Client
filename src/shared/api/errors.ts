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
