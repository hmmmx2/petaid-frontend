/**
 * Auth.js (NextAuth v5) — session layer over the FastAPI backend.
 *
 * The Credentials provider delegates verification to the existing
 * `POST /api/v1/auth/login` (so AuthManager, MFA and lockout stay the source
 * of truth). The backend's access + refresh tokens are stored inside the
 * encrypted, httpOnly session cookie. Only the short-lived access token is
 * exposed to the client (to call the API); the refresh token never leaves the
 * server and is rotated in the `jwt` callback.
 */
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const ACCESS_TTL_MS = 29 * 60 * 1000; // backend access token ~30 min; refresh a touch early

/** Distinct sign-in errors so the UI can branch (MFA step / lockout). */
class MfaRequiredError extends CredentialsSignin {
  code = "mfa_required";
}
class AccountLockedError extends CredentialsSignin {
  code = "account_locked";
}

async function backendLogin(email: string, password: string, mfaToken?: string | null) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, mfa_token: mfaToken || null }),
  });
  if (res.ok) return (await res.json()) as { access_token: string; refresh_token: string; role: string };
  let code = "invalid_credentials";
  try {
    code = (await res.json())?.code ?? code;
  } catch {
    /* ignore */
  }
  if (code === "mfa_required") throw new MfaRequiredError();
  if (code === "account_locked") throw new AccountLockedError();
  return null; // invalid credentials → generic CredentialsSignin
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 14 * 24 * 3600 },
  pages: { signIn: "/" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, mfaToken: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "");
        const password = String(creds?.password ?? "");
        const mfaToken = creds?.mfaToken ? String(creds.mfaToken) : null;
        const tokens = await backendLogin(email, password, mfaToken);
        if (!tokens) return null;
        return {
          id: email,
          email,
          role: tokens.role,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: copy backend tokens into the session JWT.
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.accessTokenExpires = Date.now() + ACCESS_TTL_MS;
        return token;
      }
      // Still fresh — nothing to do.
      const expiresAt = Number(token.accessTokenExpires ?? 0);
      if (expiresAt && Date.now() < expiresAt - 60_000) {
        return token;
      }
      // Expiring/expired → rotate via the backend refresh endpoint (server-side).
      try {
        const res = await fetch(`${API}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refresh_token: token.refreshToken }),
        });
        if (!res.ok) throw new Error("refresh failed");
        const t = await res.json();
        token.accessToken = t.access_token;
        token.refreshToken = t.refresh_token;
        token.role = t.role;
        token.accessTokenExpires = Date.now() + ACCESS_TTL_MS;
        delete token.error;
      } catch {
        token.error = "RefreshAccessTokenError";
      }
      return token;
    },
    async session({ session, token }) {
      // Expose only what the client needs; refresh token stays server-side.
      session.accessToken = token.accessToken as string | undefined;
      session.role = token.role as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
});
