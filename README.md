# Bootstrapper Client — Multi-Tenant Kanban SaaS (Web)

React SPA for [Bootstrapper](https://github.com/FramNaVer/Bootstrapper) — a multi-tenant team task manager with real-time boards, org chat, and a cross-board due-date calendar.

**Live:** [board.tanadon-i.com](https://board.tanadon-i.com) · deployed on Vercel

## Tech stack

| Concern | Choice |
|--------|--------|
| Framework | React 18 + Vite 5 + TypeScript (strict) |
| Server state | TanStack Query v5 (queries, infinite queries, cache surgery) |
| Routing | React Router 6 (route-based code splitting via `React.lazy`) |
| Styling | Tailwind CSS v4 + shadcn/ui — design tokens, light/dark theme |
| Drag & drop | dnd-kit (mouse: distance activation · touch: long-press) |
| Real-time | socket.io-client (JWT handshake, board/org rooms) |
| Toasts | sonner with a global `MutationCache` error handler |

## App shell

Discord-style three-column layout: an **org rail** (round icons, one per organization), a **sidebar** (boards + chat of the active org, user card with theme toggle / notification bell / logout), and the main content area. On mobile the rail+sidebar collapse into a hamburger drawer.

```
┌──────┬────────────────┬───────────────────────────┐
│ Rail │ Sidebar        │ Main (Outlet)             │
│ [B]  │ org name       │  /org/:id      → calendar │
│ (◯)  │ ── boards ──   │  /org/:id/chat → chat     │
│ (◯)  │  # Sprint 1    │  /.../board/:id → kanban  │
│ (+)  │ ── chat ──     │                           │
│      ├────────────────┤                           │
│      │ 👤 user 🌙 🔔 ⏻ │                           │
└──────┴────────────────┴───────────────────────────┘
```

## Patterns worth reading

- **Global mutation error toast** — a `MutationCache.onError` interceptor toasts any failed mutation; mutations that render their own error UI opt out with `meta: { silent: true }` ([src/App.tsx](src/App.tsx))
- **Shared query caches** — sidebar, rail, and pages share query keys (`["organizations"]`, `["boards", orgId]`), so navigation costs zero extra requests and one invalidation updates every consumer
- **Real-time, two ways** — boards listen for a `board:change` *signal* and refetch; chat receives `chat:new` *data* and appends straight into the infinite-query cache with id-based dedup (messages arrive via both POST response and socket echo)
- **Drag & drop with server truth** — local column state moves instantly during drag; the server computes nothing — the client sends a fractional `position`, then refetches to converge (errors self-revert)
- **Deep links** — `/org/:id/board/:bid?card=<id>` opens the card modal directly (used by the calendar; reusable for notifications)
- **CSP-safe theme boot** — dark mode class is applied by a module imported first in `main.tsx` instead of an inline script, because the production CSP (`script-src 'self'`) blocks inline scripts
- **Route-based code splitting** — every page is lazy; heavy deps (dnd-kit) live in the board page's chunk only

## Structure

```
src/
├── app/router.tsx        # lazy routes + Suspense wrapper
├── features/
│   ├── auth/             # login/register/OAuth callback/verify/reset pages
│   ├── organization/     # org pages, members dialog, org calendar
│   ├── board/            # kanban page, columns, cards, card modal, realtime hook
│   ├── chat/             # chat page, infinite history, socket append
│   └── notification/     # bell + dropdown
├── shared/
│   ├── api/              # axios client, auth interceptors, error helpers
│   ├── layout/           # AppLayout shell, OrgRail, OrgSidebar
│   ├── realtime/         # socket singleton
│   └── theme/            # ThemeProvider + CSP-safe theme-init
└── components/ui/        # shadcn/ui primitives
```

## Getting started

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000
npm run dev               # http://localhost:5173  (backend must be running)
```

## Deploy (Vercel)

`vercel.json` handles SPA rewrites plus security headers — enforcing **CSP** (`connect-src` allow-lists the API origin for both `https:` and `wss:`), `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy`. Remember: `VITE_API_URL` must be `https://` in production (mixed content is blocked).
