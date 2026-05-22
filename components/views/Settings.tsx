"use client";

/* Profile settings page — 1:1 port of views/40-settings.jsx.
   Preferences persist in localStorage; profile edits are illustrative
   (the backend exposes no profile-setter in A3 scope). */
import Image from "next/image";
import { useState } from "react";
import { Field, Icon, maskEmail, useToast } from "@/components/ui";
import type { Account } from "@/lib/petaid";

const SECTIONS = [
  { id: "profile", group: "Account", icon: "paw", label: "Edit profile" },
  { id: "security", group: "Account", icon: "shield", label: "Password & security" },
  { id: "notifs", group: "How you use", icon: "bell", label: "Notifications" },
  { id: "privacy", group: "How you use", icon: "settings", label: "Privacy" },
  { id: "connected", group: "How you use", icon: "chat", label: "Connected services" },
  { id: "data", group: "More info", icon: "upload", label: "Your data" },
  { id: "about", group: "More info", icon: "book", label: "About PetAid" },
];

const lsGet = <T,>(k: string, d: T): T => {
  if (typeof window === "undefined") return d;
  try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; }
};
const lsSet = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

const email = (a: Account) => a.email || `${a.name.split(" ")[0].toLowerCase()}@petaid.com`;

function SectionProfile({ account }: { account: Account }) {
  const { push } = useToast();
  const [name, setName] = useState(account.name);
  const [bio, setBio] = useState(lsGet("profile:bio", ""));
  const [emoji, setEmoji] = useState(lsGet("profile:emoji", "🐾"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = () => {
    setErrors({});
    if (!name.trim()) { setErrors({ name: "Name is required." }); return; }
    if (name.length > 80) { setErrors({ name: "Name must be 80 characters or fewer." }); return; }
    lsSet("profile:bio", bio); lsSet("profile:emoji", emoji);
    push("Profile saved.", "success");
  };
  return (
    <div className="settings-content">
      <div className="settings-content-head"><h1>Edit profile</h1><p>This information appears on your dashboard and to your vet team.</p></div>
      <div className="settings-form">
        <div className="settings-avatar-row">
          <div className="settings-big-avatar">{emoji}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{account.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{maskEmail(email(account))}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {["🐾", "🐕", "🐈", "🐇", "🐦", "🌿", "❤️", "⭐"].map((e) => (
                <button key={e} type="button" onClick={() => setEmoji(e)} style={{ width: 32, height: 32, borderRadius: 8, background: emoji === e ? "var(--accent-soft)" : "var(--gray)", border: emoji === e ? "1.5px solid var(--accent)" : "none", fontSize: 16 }}>{e}</button>
              ))}
            </div>
          </div>
        </div>
        <Field label="Full name" error={errors.name}><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></Field>
        <Field label="Bio" hint="Up to 150 characters. Appears under your name to vets you chat with.">
          <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 150))} rows={3} placeholder="Tell your vet a little about you and your pets…" style={{ padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, resize: "vertical" }} />
        </Field>
        <Field label="Email">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={maskEmail(email(account))} disabled style={{ flex: 1, fontFamily: "var(--font-mono)", background: "var(--gray)" }} />
            <button className="btn-ghost" onClick={() => push("Email change requires confirmation — feature available in a later release.")}>Change</button>
          </div>
        </Field>
        <div className="settings-form-foot"><button className="btn-primary" style={{ width: "auto", minWidth: 140 }} onClick={submit}>Save changes</button></div>
      </div>
    </div>
  );
}

function SectionSecurity({ account }: { account: Account }) {
  const { push } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isVet = account.role === "vet_expert";
  const submit = () => {
    const e: Record<string, string> = {};
    if (!current) e.current = "Enter your current password.";
    if (!next || next.length < 6) e.next = "New password must be at least 6 characters.";
    if (next !== confirm) e.confirm = "Passwords do not match.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setCurrent(""); setNext(""); setConfirm("");
    push("Password updated.", "success");
  };
  return (
    <div className="settings-content">
      <div className="settings-content-head"><h1>Password &amp; security</h1><p>Manage how you sign in and what protects your account.</p></div>
      <div className="settings-form">
        <div className="settings-card">
          <div className="settings-card-head"><div><strong>Password</strong><p>Set a strong password you don&apos;t use anywhere else.</p></div></div>
          <Field label="Current password" error={errors.current}><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
          <Field label="New password" error={errors.next} hint="At least 6 characters."><input type="password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
          <Field label="Confirm new password" error={errors.confirm}><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
          <button className="btn-primary" style={{ width: "auto", minWidth: 160 }} onClick={submit}>Update password</button>
        </div>
        <div className="settings-card">
          <div className="settings-card-head">
            <div><strong>Two-factor authentication</strong><p>{isVet ? "Required for all vet accounts." : "Optional. Adds a code from an authenticator app on top of your password."}</p></div>
            <span className={`tag-pill ${isVet ? "success" : ""}`}>{isVet ? "On · required" : "Off"}</span>
          </div>
          <ul className="settings-list">
            <li><span>Authenticator app</span><span className={`tag-pill ${isVet ? "success" : ""}`}>{isVet ? "Active" : "Not set"}</span></li>
            <li><span>Backup codes</span><span className="tag-pill">Not generated</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`settings-switch ${on ? "on" : ""}`}
      onClick={onClick}
    />
  );
}

function SectionNotifs() {
  const [prefs, setPrefs] = useState(() => lsGet("prefs:notif", { chat: true, inquiry: true, donation: true, marketing: false, digest: true }));
  const toggle = (k: string) => { const n = { ...prefs, [k]: !(prefs as any)[k] }; setPrefs(n); lsSet("prefs:notif", n); };
  return (
    <div className="settings-content">
      <div className="settings-content-head"><h1>Notifications</h1><p>Choose what you&apos;d like to hear about — and how.</p></div>
      <div className="settings-form">
        <div className="settings-card">
          <strong style={{ fontSize: 14 }}>Email</strong>
          <ul className="settings-list">
            <li><span><strong>Weekly digest</strong><small>Activity summary every Monday morning.</small></span><Toggle on={(prefs as any).digest} onClick={() => toggle("digest")} /></li>
            <li><span><strong>Marketing &amp; tips</strong><small>Pet-care articles and product updates.</small></span><Toggle on={(prefs as any).marketing} onClick={() => toggle("marketing")} /></li>
          </ul>
        </div>
        <div className="settings-card">
          <strong style={{ fontSize: 14 }}>In-app</strong>
          <ul className="settings-list">
            <li><span><strong>Chat alerts</strong><small>Show a banner in the dashboard for new messages.</small></span><Toggle on={(prefs as any).chat} onClick={() => toggle("chat")} /></li>
            <li><span><strong>Inquiry alerts</strong><small>Notify when a vet responds.</small></span><Toggle on={(prefs as any).inquiry} onClick={() => toggle("inquiry")} /></li>
            <li><span><strong>Donation receipts</strong><small>Confirmations and verification updates.</small></span><Toggle on={(prefs as any).donation} onClick={() => toggle("donation")} /></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionData({ account }: { account: Account }) {
  const { push } = useToast();
  const exportData = () => {
    const data = { account: account.name, role: account.role, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "petaid-data-export.json"; a.click();
    URL.revokeObjectURL(url);
    push("Your data export has been downloaded.", "success");
  };
  return (
    <div className="settings-content">
      <div className="settings-content-head"><h1>Your data</h1><p>Everything we hold about you, ready to take with you.</p></div>
      <div className="settings-form">
        <div className="settings-card">
          <strong style={{ fontSize: 14 }}>Download your data</strong>
          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "4px 0 12px" }}>A JSON file with your account information.</p>
          <button className="btn-primary" style={{ width: "auto", minWidth: 180 }} onClick={exportData}><Icon name="upload" size={14} stroke={2} /> Download archive</button>
        </div>
        <div className="settings-card">
          <strong style={{ fontSize: 14, color: "var(--danger)" }}>Delete account</strong>
          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "4px 0 12px" }}>Permanently removes your account and all associated data. This cannot be undone.</p>
          <button className="btn-ghost" style={{ color: "var(--danger)", background: "#FCE6E1" }} onClick={() => push("Account deletion requires email confirmation. Check your inbox.", "success")}>Request account deletion</button>
        </div>
      </div>
    </div>
  );
}

function SectionAbout() {
  return (
    <div className="settings-content">
      <div className="settings-content-head"><h1>About PetAid</h1><p>The story, the people, and the small print.</p></div>
      <div className="settings-form">
        <div className="settings-card" style={{ textAlign: "center", padding: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--cream)", margin: "0 auto 14px", overflow: "hidden" }}>
            <Image src="/petaid-logo.png" alt="PetAid" width={64} height={64} style={{ objectFit: "cover" }} />
          </div>
          <strong style={{ fontSize: 18, letterSpacing: "-0.01em" }}>PetAid</strong>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "4px 0 0" }}>Version 1.0.0</p>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", maxWidth: 360, margin: "14px auto 0" }}>Made with care for pet owners and the vets who help them. First-aid guidance for emergencies and everyday questions, vet-reviewed and always free.</p>
        </div>
        {[{ label: "Terms of service", icon: "book" }, { label: "Privacy policy", icon: "shield" }, { label: "Contact us", icon: "mail" }].map((item) => (
          <button key={item.label} className="settings-item" style={{ width: "100%", background: "var(--white)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8 }}>
            <div className="icon-circle"><Icon name={item.icon} size={15} /></div>
            <div className="label">{item.label}</div>
            <Icon name="chevron" size={14} className="chevron" />
          </button>
        ))}
      </div>
    </div>
  );
}

const SimpleSection = ({ title, sub }: { title: string; sub: string }) => (
  <div className="settings-content">
    <div className="settings-content-head"><h1>{title}</h1><p>{sub}</p></div>
    <div className="settings-form"><div className="settings-card"><p style={{ fontSize: 13, color: "var(--ink-2)" }}>These preferences are saved on this device for the prototype.</p></div></div>
  </div>
);

export function Settings({ account, initialSection = "profile", onClose }: { account: Account; initialSection?: string; onClose: () => void; onLogout?: () => void }) {
  const [section, setSection] = useState(initialSection);
  const grouped = SECTIONS.reduce<Record<string, typeof SECTIONS>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});
  const render = () => {
    switch (section) {
      case "profile": return <SectionProfile account={account} />;
      case "security": return <SectionSecurity account={account} />;
      case "notifs": return <SectionNotifs />;
      case "privacy": return <SimpleSection title="Privacy" sub="Decide who can reach you and what data PetAid may learn from." />;
      case "connected": return <SimpleSection title="Connected services" sub="Link PetAid to apps you already use." />;
      case "data": return <SectionData account={account} />;
      case "about": return <SectionAbout />;
      default: return null;
    }
  };
  return (
    <div className="settings-page">
      <aside className="settings-rail">
        <button className="settings-back" onClick={onClose}><Icon name="arrow_left" size={14} /> Back to dashboard</button>
        <h2 className="settings-rail-title">Settings</h2>
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{ marginTop: 18 }}>
            <div className="settings-rail-group">{group}</div>
            {items.map((it) => (
              <button key={it.id} className={`settings-rail-item ${section === it.id ? "active" : ""}`} onClick={() => setSection(it.id)}>
                <Icon name={it.icon} size={15} /><span>{it.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>
      <div className="settings-main">{render()}</div>
    </div>
  );
}
