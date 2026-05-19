"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("alwin@petaid.local");
  const [password, setPassword] = useState("petaid-demo-2026");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password, mfaToken || undefined);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "mfa_required") {
          setMfaRequired(true);
          setError("Enter your one-time code to continue.");
        } else if (err.code === "account_locked") {
          setError(`${err.message}`);
        } else {
          setError(err.message);
        }
      } else {
        setError("Login failed");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Welcome back</h1>
        <p className="sub">Sign in to your PetAid account</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {mfaRequired && (
          <>
            <label htmlFor="mfa">One-time code</label>
            <input
              id="mfa"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              required
            />
            <small style={{ color: "var(--t3)", fontSize: 11 }}>
              Demo vet account: <code>123456</code>
            </small>
          </>
        )}

        {error && <div className="err">{error}</div>}

        <button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>

        <div className="switch">
          New to PetAid? <Link href="/register">Create account</Link>
        </div>
        <div className="switch" style={{ marginTop: 8 }}>
          Vet demo: <code>vet@petaid.local</code> / <code>petaid-vet-2026</code>
        </div>
      </form>
    </div>
  );
}
