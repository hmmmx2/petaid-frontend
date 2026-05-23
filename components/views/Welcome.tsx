"use client";

/* Welcome — sign in / register / email verification / MFA / password recovery
   (SRS §7.8). Wired to the FastAPI backend via the petaid controller. */
import Image from "next/image";
import { useEffect, useState } from "react";
import { ApiError, petaid } from "@/lib/petaid";
import { BusyButton, Field, Icon, PasswordInput, PasswordRequirements, useToast } from "@/components/ui";
import { isEmail, passwordOk } from "@/lib/validation";

type Banner = { kind: "info" | "error"; text: string } | null;
type Mode = "login" | "register" | "verify" | "mfa" | "forgot" | "reset";

const RESEND_COOLDOWN = 30; // seconds; mirrors the backend resend cooldown

export function Welcome({ onAuthed, onGuest }: { onAuthed: () => void; onGuest: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [banner, setBanner] = useState<Banner>(null);
  const { push } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [mfaToken, setMfaToken] = useState("");

  const [reg, setReg] = useState({ name: "", email: "", password: "" });
  const [regConfirm, setRegConfirm] = useState("");
  const [regTerms, setRegTerms] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyErrors, setVerifyErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(0);

  // Password recovery
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPw, setResetPw] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const fieldErr = (e: unknown): Record<string, string> => {
    if (e instanceof ApiError && e.field) return { [e.field]: e.message };
    return {};
  };
  const errText = (e: unknown, fallback: string) =>
    e instanceof Error ? e.message : fallback;

  /* ------------------------------------------------------------------ login */
  async function submitLogin(mfa?: string) {
    setBanner(null);
    const errs: Record<string, string> = {};
    if (!loginEmail.trim()) errs.email = "Email is required.";
    else if (!isEmail(loginEmail)) errs.email = "Enter a valid email address.";
    if (!loginPassword) errs.password = "Password is required.";
    setLoginErrors(errs);
    if (Object.keys(errs).length) return;

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

  /* --------------------------------------------------------------- register */
  async function submitRegister() {
    setBanner(null);
    const errs: Record<string, string> = {};
    if (!reg.name.trim()) errs.full_name = "Full name is required.";
    if (!reg.email.trim()) errs.email = "Email is required.";
    else if (!isEmail(reg.email)) errs.email = "Enter a valid email address.";
    if (!passwordOk(reg.password)) errs.password = "Your password doesn't meet all the requirements below.";
    if (reg.password !== regConfirm) errs.confirm = "Passwords do not match.";
    if (!regTerms) errs.terms = "Please accept the Terms and Privacy Policy to continue.";
    setRegErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      const res = await petaid.register({ name: reg.name, email: reg.email, password: reg.password, role: "pet_owner" });
      setPendingEmail(reg.email);
      setPendingPassword(reg.password);
      setMode("verify");
      setResendIn(RESEND_COOLDOWN);
      setBanner(
        res.verification_code
          ? { kind: "info", text: `Dev only — your verification code is ${res.verification_code}` }
          : { kind: "info", text: "We've emailed you a 6-digit verification code." },
      );
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid_input") setRegErrors(fieldErr(e));
      else setBanner({ kind: "error", text: errText(e, "Could not create account.") });
    }
  }

  /* ----------------------------------------------------------- verify email */
  async function resendCode() {
    if (resendIn > 0) return;
    setVerifyErrors({});
    try {
      const res = await petaid.resendVerification(pendingEmail);
      setResendIn(RESEND_COOLDOWN);
      setBanner(
        res.verification_code
          ? { kind: "info", text: `Dev only — your new verification code is ${res.verification_code}` }
          : { kind: "info", text: "If your email is unverified, a new code is on its way." },
      );
    } catch (e) {
      setBanner({ kind: "error", text: errText(e, "Could not resend the code.") });
    }
  }

  async function submitVerification() {
    setVerifyErrors({});
    if (verificationCode.length < 6) { setVerifyErrors({ code: "Enter the 6-digit code." }); return; }
    try {
      await petaid.confirmEmail(pendingEmail, verificationCode);
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid_input") setVerifyErrors(fieldErr(e));
      else setBanner({ kind: "error", text: errText(e, "Verification failed.") });
      return;
    }
    // Email confirmed → establish the session with the same password.
    const r = await petaid.login(pendingEmail, pendingPassword);
    if (r.ok) {
      push("Email verified — welcome to PetAid.", "success");
      onAuthed();
    } else {
      setMode("login");
      setLoginEmail(pendingEmail);
      setBanner({ kind: "info", text: "Email verified. Please sign in." });
    }
  }

  /* ------------------------------------------------------- password recovery */
  async function submitForgot() {
    setBanner(null);
    const errs: Record<string, string> = {};
    if (!forgotEmail.trim()) errs.email = "Email is required.";
    else if (!isEmail(forgotEmail)) errs.email = "Enter a valid email address.";
    setForgotErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const res = await petaid.forgotPassword(forgotEmail);
      setResetEmail(forgotEmail);
      setResetCode("");
      setResetPw("");
      setResetConfirm("");
      setMode("reset");
      setBanner(
        res.reset_code
          ? { kind: "info", text: `Dev only — your reset code is ${res.reset_code}` }
          : { kind: "info", text: "If that email matches a verified account, a reset code is on its way." },
      );
    } catch (e) {
      setBanner({ kind: "error", text: errText(e, "Could not start password reset.") });
    }
  }

  async function submitReset() {
    setBanner(null);
    const errs: Record<string, string> = {};
    if (!resetCode.trim()) errs.code = "Enter the reset code.";
    if (!passwordOk(resetPw)) errs.new_password = "Your password doesn't meet all the requirements below.";
    if (resetPw !== resetConfirm) errs.confirm = "Passwords do not match.";
    setResetErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await petaid.resetPassword(resetEmail, resetCode, resetPw);
      setMode("login");
      setLoginEmail(resetEmail);
      setLoginPassword("");
      setBanner({ kind: "info", text: "Your password has been reset. Please sign in with your new password." });
    } catch (e) {
      if (e instanceof ApiError && e.field) setResetErrors(fieldErr(e));
      else setBanner({ kind: "error", text: errText(e, "Could not reset your password.") });
    }
  }

  const codeInputStyle = { fontFamily: "var(--font-mono)", letterSpacing: "0.3em", textAlign: "center" as const, fontSize: 18 };

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

          {(mode === "login" || mode === "register") && (
            <div className="tabs" role="tablist">
              <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
                Sign in
              </button>
              <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
                Create account
              </button>
            </div>
          )}

          {banner && <div className={`banner ${banner.kind}`} role="status">{banner.text}</div>}

          {mode === "login" && (
            <>
              <h1>Welcome back</h1>
              <p className="sub">Sign in to access your PetAid dashboard.</p>
              <Field label="Email" error={loginErrors.email}>
                <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" autoFocus />
              </Field>
              <Field label="Password" error={loginErrors.password}>
                <PasswordInput value={loginPassword} onChange={setLoginPassword} autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && submitLogin()} />
              </Field>
              <div className="auth-row-end">
                <button type="button" className="btn-link" onClick={() => { setForgotEmail(loginEmail); setForgotErrors({}); setBanner(null); setMode("forgot"); }}>
                  Forgot password?
                </button>
              </div>
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
                <input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="e.g. Alwin Tay" autoComplete="name" maxLength={80} autoFocus />
              </Field>
              <Field label="Email" error={regErrors.email}>
                <input value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} type="email" placeholder="you@example.com" autoComplete="email" />
              </Field>
              <Field label="Password" error={regErrors.password}>
                <PasswordInput value={reg.password} onChange={(v) => setReg({ ...reg, password: v })} autoComplete="new-password" />
              </Field>
              <PasswordRequirements value={reg.password} />
              <Field label="Confirm password" error={regErrors.confirm}>
                <PasswordInput value={regConfirm} onChange={setRegConfirm} autoComplete="new-password" />
              </Field>
              <Field error={regErrors.terms}>
                <label className="auth-check">
                  <input type="checkbox" checked={regTerms} onChange={(e) => setRegTerms(e.target.checked)} />
                  <span>I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.</span>
                </label>
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
                  onKeyDown={(e) => e.key === "Enter" && submitVerification()}
                  placeholder="••••••"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={codeInputStyle}
                  autoFocus
                />
              </Field>
              <BusyButton className="btn-primary" onClick={submitVerification} busyLabel="Verifying…">Verify &amp; continue</BusyButton>
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setMode("register")}>
                ← Back to form
              </button>
              <button className="btn-link" style={{ marginTop: 14, display: "block" }} onClick={resendCode} disabled={resendIn > 0}>
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Didn't receive a code? Resend"}
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
                  style={codeInputStyle}
                  onKeyDown={(e) => e.key === "Enter" && submitMfa()}
                  autoFocus
                />
              </Field>
              <BusyButton className="btn-primary" onClick={submitMfa} busyLabel="Verifying…">Verify &amp; sign in</BusyButton>
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => { setMode("login"); setMfaToken(""); }}>
                ← Back to sign in
              </button>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h1>Reset your password</h1>
              <p className="sub">Enter your account email and we&apos;ll send you a reset code.</p>
              <Field label="Email" error={forgotErrors.email}>
                <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" onKeyDown={(e) => e.key === "Enter" && submitForgot()} autoFocus />
              </Field>
              <BusyButton className="btn-primary" onClick={submitForgot} busyLabel="Sending…">Send reset code</BusyButton>
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => { setMode("login"); setBanner(null); }}>
                ← Back to sign in
              </button>
            </>
          )}

          {mode === "reset" && (
            <>
              <h1>Choose a new password</h1>
              <p className="sub">Enter the code sent to <strong>{resetEmail}</strong> and your new password.</p>
              <Field label="Reset code" error={resetErrors.code}>
                <input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={codeInputStyle}
                  autoFocus
                />
              </Field>
              <Field label="New password" error={resetErrors.new_password || resetErrors.password}>
                <PasswordInput value={resetPw} onChange={setResetPw} autoComplete="new-password" />
              </Field>
              <PasswordRequirements value={resetPw} />
              <Field label="Confirm new password" error={resetErrors.confirm}>
                <PasswordInput value={resetConfirm} onChange={setResetConfirm} autoComplete="new-password" />
              </Field>
              <BusyButton className="btn-primary" onClick={submitReset} busyLabel="Resetting…">Reset password</BusyButton>
              <button className="btn-link" style={{ marginTop: 14, display: "block" }} onClick={() => setMode("forgot")}>
                Use a different email
              </button>
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => { setMode("login"); setBanner(null); }}>
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
