import { Button } from "@/components/ui/button"

const API_URL = import.meta.env.VITE_API_URL

// ไอคอน inline SVG — CSP เป็น script-src 'self' และเราหลีกเลี่ยง asset ภายนอกอยู่แล้ว
// Google คงสี่สีประจำแบรนด์ / GitHub ใช้ currentColor ตามสีข้อความปุ่ม
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.56Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1.03 7.6-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.75v2.98A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6V7.12H1.75a12 12 0 0 0 0 10.76L5.6 14.7Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.68 0 3.19.58 4.38 1.71l3.28-3.28C17.7 1.19 15.1 0 12 0A11.99 11.99 0 0 0 1.75 7.12L5.6 10.1C6.5 7.39 9.02 4.77 12 4.77Z"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.09-.12-.3-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.75.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

// ปุ่มเข้าสู่ระบบด้วยผู้ให้บริการภายนอก (ใช้ร่วมทั้งหน้า login/register)
export function OAuthButtons() {
  return (
    <>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        หรือ
        <span className="bg-border h-px flex-1" />
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="outline" asChild>
          <a href={`${API_URL}/api/v1/auth/google`}>
            <GoogleIcon />
            เข้าสู่ระบบด้วย Google
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={`${API_URL}/api/v1/auth/github`}>
            <GitHubIcon />
            เข้าสู่ระบบด้วย GitHub
          </a>
        </Button>
      </div>
    </>
  )
}
