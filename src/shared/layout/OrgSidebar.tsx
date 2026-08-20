import { Link, useMatch } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Home, LogOut, MessageSquare, Moon, Plus, Sun } from "lucide-react"
import { organizationApi } from "@/features/organization/api/organization.api"
import { boardApi } from "@/features/board/api/board.api"
import { CreateBoardDialog } from "@/features/board/components/CreateBoardDialog"
import { CreateOrganizationDialog } from "@/features/organization/components/CreateOrganizationDialog"
import { NotificationBell } from "@/features/notification/NotificationBell"
import { useAuth } from "@/features/auth/AuthContext"
import { useTheme } from "@/shared/theme/ThemeProvider"
import { Avatar, initials } from "@/shared/components/Avatar"
import { cn } from "@/lib/utils"

// คอลัมน์ที่สองของ shell: รายการบอร์ดของ org ที่เลือกอยู่
// ล่างสุดคือการ์ดผู้ใช้ (ตำแหน่งเดียวกับ Discord)
export function OrgSidebar() {
  const orgMatch = useMatch("/org/:orgId/*")
  const boardMatch = useMatch("/org/:orgId/board/:boardId")
  const chatMatch = useMatch("/org/:orgId/chat")
  const orgId = orgMatch?.params.orgId
  const activeBoardId = boardMatch?.params.boardId
  const chatActive = !!chatMatch

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: organizationApi.list,
  })
  const org = organizations?.find((o) => o.id === orgId)

  // key เดียวกับ OrgDetailPage → เปิดหน้า org แล้ว sidebar ได้ข้อมูลฟรีจาก cache
  const { data: boards } = useQuery({
    queryKey: ["boards", orgId],
    queryFn: () => boardApi.listBoards(orgId!),
    enabled: !!orgId, // ยังไม่ได้เลือก org → ไม่ยิง API
  })

  return (
    <div className="bg-card flex w-60 shrink-0 flex-col border-r">
      {!orgId ? (
        // หน้าหลัก (ยังไม่เลือก org) — แผงนำทาง: ลิงก์รวม + รายการ org สลับเข้าได้เลย
        <>
          <div className="border-b px-4 py-3">
            <p className="truncate font-semibold">พื้นที่ทำงาน</p>
            <p className="text-muted-foreground text-xs">
              {organizations?.length
                ? `${organizations.length} องค์กร`
                : "เริ่มต้นสร้างองค์กรแรกของคุณ"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <Link
              to="/"
              className="bg-accent text-foreground mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium"
            >
              <Home className="size-4 shrink-0" /> องค์กรทั้งหมด
            </Link>

            <div className="text-muted-foreground mb-1 flex items-center justify-between px-2 text-xs font-semibold tracking-wide uppercase">
              องค์กร
              <CreateOrganizationDialog
                trigger={
                  <button
                    title="สร้างองค์กรใหม่"
                    className="hover:bg-accent hover:text-foreground rounded p-0.5"
                  >
                    <Plus className="size-4" />
                  </button>
                }
              />
            </div>

            {organizations?.length === 0 && (
              <p className="text-muted-foreground px-2 py-1 text-sm">
                ยังไม่มีองค์กร — กด + เพื่อสร้าง
              </p>
            )}

            <ul className="flex flex-col gap-0.5">
              {organizations?.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/org/${o.id}`}
                    className="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                    title={o.name}
                  >
                    <Avatar seed={o.id} label={initials(o.name, undefined)} small />
                    <span className="flex-1 truncate">{o.name}</span>
                    {o.role === "OWNER" && (
                      <span className="text-primary bg-primary/10 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium">
                        เจ้าของ
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          {/* หัวคอลัมน์ = ชื่อ org (กดเข้าหน้า overview: บอร์ดทั้งหมด + สมาชิก) */}
          <Link
            to={`/org/${orgId}`}
            className="hover:bg-accent block truncate border-b px-4 py-3 font-semibold"
            title={org?.name}
          >
            {org?.name ?? "องค์กร"}
          </Link>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-muted-foreground mb-1 flex items-center justify-between px-2 text-xs font-semibold tracking-wide uppercase">
              บอร์ด
              <CreateBoardDialog
                orgId={orgId}
                trigger={
                  <button
                    title="สร้างบอร์ดใหม่"
                    className="hover:bg-accent hover:text-foreground rounded p-0.5"
                  >
                    <Plus className="size-4" />
                  </button>
                }
              />
            </div>

            {boards?.length === 0 && (
              <p className="text-muted-foreground px-2 py-1 text-sm">
                ยังไม่มีบอร์ด
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {boards?.map((board) => (
                <li key={board.id}>
                  <Link
                    to={`/org/${orgId}/board/${board.id}`}
                    className={cn(
                      "block truncate rounded-md px-2 py-1.5 text-sm",
                      board.id === activeBoardId
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    # {board.name}
                  </Link>
                </li>
              ))}
            </ul>
            {/* แชท — หนึ่ง org มีห้องเดียว (v1) */}
            <div className="text-muted-foreground mt-4 mb-1 px-2 text-xs font-semibold tracking-wide uppercase">
              แชท
            </div>
            <Link
              to={`/org/${orgId}/chat`}
              className={cn(
                "flex items-center gap-1.5 truncate rounded-md px-2 py-1.5 text-sm",
                chatActive
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <MessageSquare className="size-3.5 shrink-0" /> ห้องแชท
            </Link>
          </div>
        </>
      )}

      <UserCard />
    </div>
  )
}

// การ์ดผู้ใช้มุมล่างซ้าย: avatar + ชื่อ + สลับธีม + กระดิ่ง + ออกจากระบบ
function UserCard() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  if (!user) return null

  return (
    <div className="bg-secondary/40 flex items-center gap-1.5 border-t p-2">
      <Avatar seed={user.id} label={initials(user.displayName, user.email)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {user.displayName ?? user.email}
        </p>
        {user.displayName && (
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        )}
      </div>
      <button
        title={theme === "dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
        onClick={toggleTheme}
        className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-2"
      >
        {theme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </button>
      {/* มือถือใช้กระดิ่งบน top bar แทน (ใน drawer แคบ dropdown จะล้นจอ) */}
      <div className="hidden md:block">
        <NotificationBell dropUp />
      </div>
      <button
        title="ออกจากระบบ"
        onClick={() => void signOut()}
        className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-2"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  )
}
