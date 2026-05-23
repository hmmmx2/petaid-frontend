import { auth } from "@/auth";

/**
 * Edge auth middleware (route-protection scaffold).
 *
 * PetAid is currently a single-page app served at `/`, and the login screen
 * lives at `/` itself — so we deliberately do NOT redirect unauthenticated
 * users away from `/` (that would hide the login UI). Backend RBAC remains the
 * real enforcement point.
 *
 * This wires the Auth.js session at the edge and is the hook for protecting any
 * future role-specific routes: add a path to `PROTECTED` (e.g. `/owner`,
 * `/vet`) and it will require a session, redirecting to `/` when absent. Role
 * checks can then read `req.auth.role` here once such routes exist.
 */
const PROTECTED: string[] = [];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (needsAuth && !req.auth) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  // Run on app routes; skip static assets and the Auth.js API itself.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|petaid-logo.png).*)"],
};
