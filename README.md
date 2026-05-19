# petaid-frontend

Next.js 14 frontend for [PetAid](https://github.com/) — a warm, light-mode web app for pet first-aid guidance and veterinary support.

- **Framework:** Next.js 14 App Router · TypeScript (strict) · React 18
- **Styling:** CSS Modules + a single design-token sheet (`app/globals.css`)
- **Auth:** JWT bearer tokens stored in `localStorage` with automatic refresh
- **Deploys to:** Vercel

The backend lives in a separate repo: **petaid-backend** (FastAPI on Railway). This app talks to it only over HTTPS via `NEXT_PUBLIC_API_BASE_URL`.

## Quick start (local)

```powershell
npm install
Copy-Item .env.example .env.local
# Edit .env.local — point NEXT_PUBLIC_API_BASE_URL at your backend
# (e.g. http://localhost:8000 for a locally-running petaid-backend)

npm run dev
# → http://localhost:3000
```

Sign in with the seeded demo credentials from the backend:

- **Email:** `alwin@petaid.local`
- **Password:** `petaid-demo-2026`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | ESLint (next/core-web-vitals config) |
| `npm run typecheck` | `tsc --noEmit` strict type check |

## Project layout

```
app/
├── layout.tsx          Root layout, imports globals.css
├── page.tsx            Redirects to /dashboard or /login based on token
├── globals.css         Design tokens (coral, teal, ivory, etc.)
├── login/page.tsx      JWT login form
├── register/page.tsx   Registration form
└── dashboard/
    ├── page.tsx        Three-column dashboard
    └── dashboard.module.css
components/             Sidebar · Topbar · StatCards · ActivityChart · ResourcesCard · RightPanel · icons
lib/
├── api.ts              Typed fetch client + token storage + auto-refresh
└── types.ts            DTOs mirroring backend Pydantic schemas
next.config.js          reactStrictMode, typed routes
vercel.json             Vercel build config
```

## Environment variables

| Var | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | client + server | Public — exposed to the browser. e.g. `https://api.petaid.example.com` |

Anything secret must **not** start with `NEXT_PUBLIC_` (Next.js inlines those into the bundle).

## Backend contract

This app expects an API matching the OpenAPI schema served by `petaid-backend` at `/openapi.json`. The TypeScript types in [lib/types.ts](lib/types.ts) mirror the Pydantic schemas in the backend's `app/schemas/`. When the backend's schema changes:

1. Pull the new `openapi.json` from the backend.
2. Update [lib/types.ts](lib/types.ts) (or regenerate with `openapi-typescript`).
3. Update any components that depend on the changed shape.

The auth contract:

- `POST /api/v1/auth/login` → `{ access_token, refresh_token, token_type }`
- All authed requests send `Authorization: Bearer <access_token>`.
- On `401`, the client transparently calls `POST /api/v1/auth/refresh` with the refresh token; on failure it clears tokens and redirects to `/login`.

## Deployment — Vercel

1. Import this repo into Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Environment variable: `NEXT_PUBLIC_API_BASE_URL=https://<your-railway-backend>`.
4. Make sure the backend's `CORS_ORIGINS` includes your Vercel preview + production URLs.
5. Deploy. Subsequent pushes to the default branch trigger production deploys; PRs get preview URLs.

## Best practices baked in

- TypeScript strict mode, typed routes (`experimental.typedRoutes`).
- CSS Modules per-route — no global class collisions; tokens via CSS custom properties.
- Single source of truth for design tokens (`globals.css`), styled exactly to the mockup palette.
- Server-friendly client components: the dashboard page is a `"use client"` page only because of `useEffect`/`useState`; data fetching is colocated.
- No secrets in the bundle — only `NEXT_PUBLIC_*` env vars are exposed.
- JWT refresh handled transparently in `lib/api.ts`; auth state never leaks into components.
- `poweredByHeader: false` to avoid advertising the framework.

## Next steps (not yet implemented)

- Replace `localStorage` token storage with httpOnly cookies + a tiny Next.js route handler for SSR-friendly auth.
- Add `openapi-typescript` postinstall hook to regenerate `lib/types.ts` automatically.
- Pages for: My Pets, Resources, Take a Quiz, Chat with Vet, Submit Inquiry.
- Loading skeletons in place of the plain "Loading dashboard…" state.
- E2E tests with Playwright.
