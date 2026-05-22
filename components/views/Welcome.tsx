"use client";

/* Welcome — login / register / email verification / MFA (SRS §7.8).
   1:1 port of views/10-auth.jsx, wired to the FastAPI backend. */
import Image from "next/image";
import { useState } from "react";
import { ApiError, petaid } from "@/lib/petaid";
import { Field, useToast } from "@/components/ui";

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
    try {
      await petaid.login(loginEmail, loginPassword, mfa);
      push(`Welcome back, ${loginEmail.split("@")[0]}.`, "success");
      onAuthed();
    } catch (e) {
      if (e instanceof ApiError && e.code === "mfa_required") {
        setMode("mfa");
        setBanner({ kind: "info", text: "Multi-factor authentication required. Enter the 6-digit code from your authenticator app." });
      } else if (e instanceof ApiError && e.code === "invalid_input") {
        setLoginErrors(fieldErr(e));
      } else {
        setBanner({ kind: "error", text: e instanceof Error ? e.message : "Sign in failed." });
      }
    }
  }

  async function submitMfa() {
    setBanner(null);
    try {
      await petaid.login(loginEmail, loginPassword, mfaToken);
      push("Welcome back.", "success");
      onAuthed();
    } catch (e) {
      setBanner({ kind: "error", text: e instanceof Error ? e.message : "Invalid code." });
    }
  }

  async function submitRegister() {
    setBanner(null);
    setRegErrors({});
    try {
      const res = await petaid.register({ name: reg.name, email: reg.email, password: reg.password, role: reg.role });
      setPendingEmail(reg.email);
      setHintCode(res.verification_code);
      setMode("verify");
      setBanner({ kind: "info", text: `Demo: your verification code is ${res.verification_code}` });
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid_input") setRegErrors(fieldErr(e));
      else setBanner({ kind: "error", text: e instanceof Error ? e.message : "Could not create account." });
    }
  }

  async function submitVerification() {
    setVerifyErrors({});
    try {
      await petaid.verifyEmail(pendingEmail, verificationCode);
      push("Email verified — welcome to PetAid.", "success");
      onAuthed();
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid_input") setVerifyErrors(fieldErr(e));
      else setBanner({ kind: "error", text: e instanceof Error ? e.message : "Verification failed." });
    }
  }

  function applyDemo(email: string, password: string) {
    setLoginEmail(email);
    setLoginPassword(password);
    setMode("login");
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
              <button className="btn-primary" onClick={() => submitLogin()}>Sign in</button>

              <div className="demo-block" style={{ background: "transparent", border: "1px dashed var(--line-2)", padding: 18, marginTop: 22 }}>
                <strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Try a demo account</strong>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <button className="btn-secondary" style={{ fontSize: 12.5, width: "auto", padding: "7px 12px" }} onClick={() => applyDemo("alwin@petaid.com", "pet123")}>
                    Pet Owner →
                  </button>
                  <button className="btn-secondary" style={{ fontSize: 12.5, width: "auto", padding: "7px 12px" }} onClick={() => applyDemo("kavitha@petaid.com", "vet123")}>
                    Vet Expert → <span style={{ color: "var(--ink-3)" }}>(MFA 123456)</span>
                  </button>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "0 0 12px", lineHeight: 1.4 }}>
                  Or browse the public first-aid library without an account.
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
              <button className="btn-primary" onClick={submitRegister}>Create account</button>
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
              <button className="btn-primary" onClick={submitVerification}>Verify &amp; continue</button>
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setMode("register")}>
                ← Back to form
              </button>
              <button className="btn-link" style={{ marginTop: 14, display: "block" }} onClick={() => setVerificationCode(hintCode)}>
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
              <button className="btn-primary" onClick={submitMfa}>Verify &amp; sign in</button>
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
