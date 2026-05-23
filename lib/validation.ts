/**
 * Shared client-side validation helpers for the auth screens.
 *
 * These mirror the backend rules (AuthManager.validate_password_strength and the
 * register/reset schemas) so the UI can give instant inline feedback. The
 * backend remains the source of truth — the client checks are UX only.
 */

/** Lightweight email format check (intentionally permissive, like the backend's). */
export function isEmail(value: string): boolean {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export type PasswordChecks = {
  minLen: boolean; // ≥ 8 characters
  upper: boolean; // an uppercase letter
  lower: boolean; // a lowercase letter
  digit: boolean; // a number
};

/** Per-rule booleans for the password policy (8+, upper, lower, digit). */
export function passwordChecks(pw: string): PasswordChecks {
  return {
    minLen: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
  };
}

/** True when the password satisfies every policy rule. */
export function passwordOk(pw: string): boolean {
  const c = passwordChecks(pw);
  return c.minLen && c.upper && c.lower && c.digit;
}

/** The human-readable list of policy rules, paired with PasswordChecks keys. */
export const PASSWORD_RULES: { key: keyof PasswordChecks; label: string }[] = [
  { key: "minLen", label: "At least 8 characters" },
  { key: "upper", label: "An uppercase letter" },
  { key: "lower", label: "A lowercase letter" },
  { key: "digit", label: "A number" },
];

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/** A coarse 0–4 strength score + label for the visual meter. Combines the
 *  policy rules met with a small bonus for a longer (12+) password. */
export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: "" };
  const c = passwordChecks(pw);
  let score = (c.minLen ? 1 : 0) + (c.upper ? 1 : 0) + (c.lower ? 1 : 0) + (c.digit ? 1 : 0);
  // Demote very short passwords; promote long all-rules-met ones.
  if (pw.length < 8 && score > 2) score = 2;
  const labels = ["", "Weak", "Fair", "Good", pw.length >= 12 ? "Strong" : "Good"];
  return { score: score as Strength["score"], label: labels[score] };
}
