"use client";

/* Welcome — login / register / email verification / MFA (SRS §7.8).
   1:1 port of views/10-auth.jsx, wired to the FastAPI backend. */
import Image from "next/image";
import { useState } from "react";
import { ApiError, petaid } from "@/lib/petaid";
import { BusyButton, Field, Icon, useToast } from "@/components/ui";

type Banner = { kind: "info" | "error"; text: string } | null;
type Mode = "login" | "register" | "verify" | "mfa";

export function Welcome({ onAuthed, onGuest }: { onAuthed: () => void; onGuest: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [banner, setBanner] = useState<Banner>(null);
  const { push } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [mfaToken, setMfaToken] = useState("");

  const [reg, setReg] = useState({ role: "pet_owner" as "pet_owner" | "vet_expert", name: "", email: "", password: "" });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [hintCode, setHintCode] = useState("");
  const [verifyErrors, setVerifyErrors] = useState<Record<string, string>>({});

  const fieldErr = (e: unknown): Record<string, string> => {
    if (e instanceof ApiError && e.field) return { [e.field]: e.message };
    return {};
  };

  async function submitLogin(mfa?: string) {
    setBanner(null);
    setLoginErrors({});
    // `login()` resolves with a reliable { ok, code } (success is confirmed by
    // an established session, not by signIn's flaky return flags).
    const r = await petaid.login(loginEmail, loginPassword, mfa);
    if (r.ok) {
      push(`Welcome back, ${loginEmail.split("@")[0]}.`, "success");
      onAuthed();
      return;
    }
    if (r.code === "mfa_required") {
      setMode("mfa");
      setBanner({ kind: "info", text: "Multi-factor authentication required. Enter the 6-digit code from your authenticator app." });
    } else if (r.code === "account_locked") {
      setBanner({ kind: "error", text: "Too many failed attempts. Please wait ~30 seconds and try again." });
    } else {
      setBanner({ kind: "error", text: "The email or password you entered is incorrect." });
    }
  }

  async function submitMfa() {
    setBanner(null);
    const r = await petaid.login(loginEmail, loginPassword, mfaToken);
    if (r.ok) {
      push("Welcome back.", "success");
      onAuthed();
    } else {
      setBanner({ kind: "error", text: "Invalid MFA code." });
    }
  }

  async function submitRegister() {
    setBanner(null);
    setRegErrors({});
    try {
      const res = await petaid.register({ name: reg.name, email: reg.email, password: reg.password, role: reg.role });
      setPendingEmail(reg.email);
      setHintCode(res.verification_code || "");
      setMode("verify");
      // The code is only returned in non-production builds (no mail server in
      // dev). In production it arrives by email and is never shown here.
      setBanner(
        res.verification_code
          ? { kind: "info", text: `Dev only — your verification code is ${res.verification_code}` }
          : { kind: "info", text: "We've emailed you a 6-digit verification code." },
      );
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid_input") setRegErrors(fieldErr(e));
      else setBanner({ kind: "error", text: e instanceof Error ? e.message : "Could not create account." });
    }
  }

  async function resendCode() {
    setVerifyErrors({});
    try {
      const res = await petaid.resendVerification(pendingEmail);
      setHintCode(res.verification_code || "");
      setBanner(
        res.verification_code
          ? { kind: "info", text: `Dev only — your new verification code is ${res.verification_code}` }
          : { kind: "info", text: "If your email is unverified, a new code is on its way." },
      );
    } catch (e) {
      setBanner({ kind: "error", text: e instanceof Error ? e.message : "Could not resend the code." });
    }
  }

  async function submitVerification() {
    setVerifyErrors({});
    try {
      await petaid.confirmEmail(pendingEmail, verificationCode);
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid_input") setVerifyErrors(fieldErr(e));
      else setBanner({ kind: "error", text: e instanceof Error ? e.message : "Verification failed." });
      return;
    }
    // Email confirmed → establish the Auth.js session with the same password.
    const r = await petaid.login(pendingEmail, reg.password);
    if (r.ok) {
      push("Email verified — welcome to PetAid.", "success");
      onAuthed();
    } else {
      setMode("login");
      setLoginEmail(pendingEmail);
      setBanner({ kind: "info", text: "Email verified. Please sign in." });
    }
  }

  return (
    <div className="auth-stage">
      {/* LEFT: art panel */}
      <div className="auth-pane auth-art">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="logo-block">
          <div className="logo-mark">
            <Image src="/petaid-logo.png" alt="PetAid" width={56} height={56} priority />
          </div>
          <h2>
            First-aid<br />for the pets you love.
          </h2>
          <p>
            Step-by-step emergency guidance, vet-reviewed resources, and a 24/7 channel to a real
            expert — all in one place.
          </p>
        </div>
      </div>

      {/* RIGHT: form */}
      <div className="auth-pane">
        <div className="auth-form">
          {(mode === "login" || mode === "register") && (
            <button type="button" className="auth-back" onClick={onGuest} aria-label="Back to the home page">
              <Icon name="arrow_left" size={15} stroke={1.9} />
              Back to home
            </button>
          )}

          {mode !== "verify" && mode !== "mfa" && (
            <div className="tabs" role="tablist">
              <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
                Sign in
              </button>
              <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
                Create account
              </button>
            </div>
          )}

          {banner && <div className={`banner ${banner.kind}`}>{banner.text}</div>}

          {mode === "login" && (
            <>
              <h1>Welcome back</h1>
              <p className="sub">Sign in to access your PetAid dashboard.</p>
              <Field label="Email" error={loginErrors.email}>
                <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" />
              </Field>
              <Field label="Password" error={loginErrors.password}>
                <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && submitLogin()} />
              </Field>
              <BusyButton className="btn-primary" onClick={() => submitLogin()} busyLabel="Signing in…">Sign in</BusyButton>

              <div className="demo-block" style={{ background: "transparent", border: "1px dashed var(--line-2)", padding: 18, marginTop: 22 }}>
                <strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Need first-aid help right now?</strong>
                <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "0 0 12px", lineHeight: 1.4 }}>
                  Browse the public first-aid library without an account. No personal data is stored.
                </p>
                <button className="btn-secondary" onClick={onGuest} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, width: "auto", padding: "8px 14px" }}>
                  Continue as guest <span style={{ color: "var(--ink-3)" }}>→</span>
                </button>
              </div>
            </>
          )}

          {mode === "register" && (
            <>
              <h1>Create your account</h1>
              <p className="sub">
                Pet owners get full access immediately. Veterinary Experts are provisioned by the
                Veterinary Association —{" "}
                <button className="btn-link" onClick={() => setMode("login")} style={{ background: "none", padding: 0 }}>
                  sign in here
                </button>
                .
              </p>
              <Field label="Full name" error={regErrors.full_name}>
                <input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="e.g. Alwin Tay" />
              </Field>
              <Field label="Email" error={regErrors.email}>
                <input value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} type="email" placeholder="you@example.com" />
              </Field>
              <Field label="Password" error={regErrors.password} hint="At least 6 characters.">
                <input value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} type="password" placeholder="••••••••" />
              </Field>
              <BusyButton className="btn-primary" onClick={submitRegister} busyLabel="Creating…">Create account</BusyButton>
            </>
          )}

          {mode === "verify" && (
            <>
              <h1>Verify your email</h1>
              <p className="sub">
                A 6-digit code was sent to <strong>{pendingEmail}</strong>. Check your inbox — it
                expires in 15 minutes.
              </p>
              <Field label="Verification code" error={verifyErrors.code}>
                <input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.3em", textAlign: "center", fontSize: 18 }}
                />
              </Field>
              <BusyButton className="btn-primary" onClick={submitVerification} busyLabel="Verifying…">Verify &amp; continue</BusyButton>
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setMode("register")}>
                ← Back to form
              </button>
              <button className="btn-link" style={{ marginTop: 14, display: "block" }} onClick={resendCode}>
                Didn&apos;t receive a code? Resend
              </button>
            </>
          )}

          {mode === "mfa" && (
            <>
              <h1>Multi-factor authentication</h1>
              <p className="sub">Open your authenticator app and enter the 6-digit code shown for PetAid.</p>
              <Field label="MFA code">
                <input
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.3em", textAlign: "center", fontSize: 18 }}
                  onKeyDown={(e) => e.key === "Enter" && submitMfa()}
                />
              </Field>
              <BusyButton className="btn-primary" onClick={submitMfa} busyLabel="Verifying…">Verify &amp; sign in</BusyButton>
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => { setMode("login"); setMfaToken(""); }}>
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
