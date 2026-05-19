"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register(email, password, fullName);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create your account</h1>
        <p className="sub">Track your pets and unlock first-aid guidance</p>

        <label htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password (min 8)</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="err">{error}</div>}

        <button type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>

        <div className="switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
