# PetAid — Frontend (Next.js)

The web user interface for **PetAid**, a warm, light-mode app for pet first-aid guidance and
veterinary support. It serves two role-based dashboards — **Pet Owner** and **Veterinary Expert** —
plus a guest first-aid browser and the full authentication flow.

This app talks to the **[`petaid-backend`](https://github.com/hmmmx2/petaid-backend)** (FastAPI) over
HTTPS and a WebSocket. It does **not** connect to the database directly.

> Built for **SWE30003 — Software Architectures & Design, Assignment 3**.

- **Framework:** Next.js 14 (App Router) · React 18 · TypeScript (strict)
- **Auth:** Auth.js / NextAuth v5 (Credentials → FastAPI), tokens in an encrypted **httpOnly** cookie
- **Real-time:** native WebSocket client for live chat (messages, typing, presence, read receipts)
- **Styling:** one global design-token stylesheet (`app/petaid.css`) + inline styles
- **Deploys to:** Vercel

## Architecture at a glance

```
Browser ──►  petaid-frontend (Next.js, this repo)  ──HTTPS/JSON──►  petaid-backend (FastAPI)  ──►  PostgreSQL (Supabase)
                                                     ◄──WebSocket──   /api/v1/ws/chat
```

> **Note on Supabase:** the database is owned by the backend. The frontend reaches data **only**
> through the FastAPI API, so this app does *not* use the Supabase JS client or anon key. Keeping a
> single data path keeps RBAC, validation and rate limits in one place (the backend).

---

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| **Node.js** | 18.17+ or 20+ | `node --version` |
| **npm** | 9+ (ships with Node) | `npm --version` |
| **A running `petaid-backend`** | – | local on `http://localhost:8000` or a deployed URL |
| **Git** | any | to clone |

Development & testing platform: **Windows 11 + PowerShell**, editor **VS Code**, tested in Chrome.

> **Set up the backend first.** Follow the README in
> [`petaid-backend`](https://github.com/hmmmx2/petaid-backend) so the API is running and the demo
> accounts are seeded before you sign in here.

---

## 2. Clone the repository

```powershell
git clone https://github.com/hmmmx2/petaid-frontend.git
cd petaid-frontend
```

## 3. Install dependencies

```powershell
npm install
```

## 4. Configure environment variables

```powershell
Copy-Item .env.example .env.local       # macOS/Linux:  cp .env.example .env.local
```

Edit `.env.local`:

```dotenv
# Public — the base URL of the FastAPI backend (exposed to the browser)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Auth.js (NextAuth v5) — server-only secret. REQUIRED.
AUTH_SECRET=<paste a long random string>
AUTH_TRUST_HOST=true
```

Generate `AUTH_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> Only variables prefixed `NEXT_PUBLIC_` are exposed to the browser. `AUTH_SECRET` must **not** be
> public — it encrypts the session cookie that holds the backend tokens.

## 5. Run the dev server

```powershell
npm run dev
```

Open <http://localhost:3000>.

## 6. Sign in (demo accounts seeded by the backend)

| Role | Email | Password | MFA |
| --- | --- | --- | --- |
| **Pet Owner** | `alwin@petaid.com` | `pet123` | none |
| **Veterinary Expert** | `kavitha@petaid.com` | `vet123` | enter the 6-digit TOTP code the backend seed prints |

Or click **“Browse as guest”** to view the public first-aid library without an account.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` strict type check |

## Project layout

```
app/
├── layout.tsx                Root layout (fonts, imports app/petaid.css)
├── page.tsx                  Role router: Welcome / Guest / PetOwner / VetExpert from the session
├── petaid.css                Global design tokens + component styles
└── api/auth/[...nextauth]/   NextAuth route handler
auth.ts                       Auth.js config: Credentials → FastAPI /auth/login, token refresh in JWT callback
middleware.ts                 Route protection
components/
├── ui.tsx                    Shared primitives (Icon, Modal, BusyButton, ImageGallery, toasts, helpers)
└── views/
    ├── Welcome.tsx           Sign in / register / email-verify / MFA
    ├── Guest.tsx             Public first-aid browser
    ├── PetOwner.tsx          Pet Owner dashboard
    ├── VetExpert.tsx         Veterinary Expert (admin) dashboard
    ├── ChatThread.tsx        Shared real-time chat UI (used by both roles)
    ├── Settings.tsx · Help.tsx · Popovers.tsx
lib/
├── petaid.tsx                API client + snapshot/types + React context (PetAidProvider)
├── chatSocket.ts             Reconnecting WebSocket client (heartbeat + backoff)
└── chatRealtime.tsx          Live chat state provider (messages/typing/presence/read)
types/next-auth.d.ts          Session type augmentation
next.config.js                Strict mode, security headers (CSP allows the backend ws/wss origin)
vercel.json
```

## How auth works

- Sign-in uses the **Credentials** provider, which calls `POST /api/v1/auth/login` on the backend
  (so MFA, lockout and RBAC stay server-owned).
- The backend’s **access + refresh tokens are stored in the encrypted, httpOnly session cookie**.
  Only the short-lived access token is exposed to the client to call the API; the refresh token never
  leaves the server and is rotated automatically in the Auth.js `jwt` callback.
- On a `401`, the client refreshes the session once and retries.

## Environment variables

| Var | Where | Required | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | client + server | yes | Base URL of the backend, e.g. `http://localhost:8000` or your Railway URL |
| `AUTH_SECRET` | server only | yes | Encrypts the session cookie — keep secret |
| `AUTH_TRUST_HOST` | server only | recommended | `true` for local/non-Vercel hosts |

## Deployment — Vercel

1. Import this repo into Vercel (framework preset **Next.js** is auto-detected).
2. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL=https://<your-railway-backend>`
   - `AUTH_SECRET=<long random string>`
   - `AUTH_TRUST_HOST=true`
3. Make sure the backend’s `CORS_ORIGINS` includes your Vercel preview **and** production URLs, and
   that the backend allows the frontend origin to open the WebSocket.
4. Deploy. Pushes to the default branch ship to production; PRs get preview URLs.

## Coding standard

TypeScript **strict** mode throughout; linting via **ESLint** with the official
[`eslint-config-next`](https://nextjs.org/docs/app/api-reference/config/eslint) (`next/core-web-vitals`).
Components follow the standard React/Next.js conventions (function components, hooks, colocated state).
