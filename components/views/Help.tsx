"use client";

/* Help Center modal — 1:1 port of views/15-help.jsx (static FAQ). */
import { useMemo, useState } from "react";
import { Icon, Modal, useToast } from "@/components/ui";

const HELP_TOPICS = [
  {
    id: "getting-started", title: "Getting started", icon: "paw",
    articles: [
      { q: "How do I add my first pet?", a: 'From the dashboard, click "Add pet" in the Your Pets section. Choose a pet type — that drives which guidance and quizzes show up for you.' },
      { q: "How does the emergency button work?", a: "Tap the orange Emergency button in the top bar at any time. PetAid shows step-by-step protocols filtered to your pet type. The button works even offline." },
      { q: "Can I have more than one pet?", a: "Yes — add as many pets as you like. Guidance content adapts to whichever pet you select first on the dashboard." },
    ],
  },
  {
    id: "safety", title: "Emergencies & safety", icon: "alert",
    articles: [
      { q: "Is PetAid a substitute for a vet?", a: "No. PetAid provides first-aid guidance during the time it takes to reach professional care. Always contact a vet for any medical emergency." },
      { q: "What if I need help right now?", a: "Use Vet Chat (live, real-time) or call your registered vet from the Profile section. For genuine emergencies, call your local emergency vet line directly." },
    ],
  },
  {
    id: "account", title: "Account & security", icon: "shield",
    articles: [
      { q: "How do I change my password?", a: "Go to Settings → Password & security → enter your current and new password." },
      { q: "What is two-factor authentication?", a: "An optional extra layer that requires a 6-digit code from an authenticator app on top of your password. Required for vet expert accounts." },
      { q: "I forgot my password.", a: 'On the sign-in screen, click "Forgot password" — we will email you a reset link valid for 30 minutes.' },
    ],
  },
  {
    id: "donations", title: "Donations & receipts", icon: "gift",
    articles: [
      { q: "Where do donations go?", a: "Every donation supports the Veterinary Association, which maintains free first-aid content and funds outreach to under-served communities." },
      { q: "Can I get a tax receipt?", a: "Yes — receipts are emailed automatically after each successful donation, and a copy is stored in your Donations panel." },
      { q: "How do I cancel a recurring donation?", a: "Settings → Connected services → manage your monthly contribution. You can cancel any time, no questions asked." },
    ],
  },
  {
    id: "privacy", title: "Privacy & data", icon: "settings",
    articles: [
      { q: "Who can see my pets and history?", a: "Only you and any vet expert you actively chat with or submit an inquiry to. PetAid never sells personal data." },
      { q: "Can I download my data?", a: "Settings → Your data → Download archive. You receive a JSON file with everything we hold." },
      { q: "How do I delete my account?", a: "Settings → Your data → Request account deletion. A confirmation email is sent; your data is permanently removed within 30 days." },
    ],
  },
];

export function HelpCenter({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [openTopic, setOpenTopic] = useState<(typeof HELP_TOPICS)[number] | null>(null);
  const { push } = useToast();

  const allArticles = useMemo(
    () => HELP_TOPICS.flatMap((t) => t.articles.map((a) => ({ ...a, topicTitle: t.title }))),
    [],
  );
  const filtered = query.trim()
    ? allArticles.filter((a) => (a.q + " " + a.a).toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <Modal title="Help center" subtitle="Find answers, or get in touch with us." onClose={onClose} wide>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 14, top: 13 }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help articles…" style={{ width: "100%", padding: "11px 14px 11px 38px", border: "1px solid var(--line-2)", borderRadius: 10 }} />
      </div>

      {query.trim() ? (
        <>
          <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 500 }}>
            {filtered.length} result{filtered.length === 1 ? "" : "s"} for &quot;{query}&quot;
          </div>
          {filtered.length === 0 && <div className="empty-state"><strong>No matching articles.</strong>Try a different search term, or contact support.</div>}
          {filtered.map((a, i) => (
            <details key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <summary style={{ fontSize: 14, fontWeight: 600, cursor: "pointer", listStyle: "none" }}>
                {a.q}<span style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginLeft: 8, fontWeight: 500 }}> · {a.topicTitle}</span>
              </summary>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "8px 0 0", lineHeight: 1.5 }}>{a.a}</p>
            </details>
          ))}
        </>
      ) : openTopic ? (
        <>
          <button className="btn-ghost" style={{ marginBottom: 12 }} onClick={() => setOpenTopic(null)}><Icon name="arrow_left" size={13} /> All topics</button>
          <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 12px" }}>{openTopic.title}</h3>
          {openTopic.articles.map((a, i) => (
            <details key={i} open={i === 0} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <summary style={{ fontSize: 14, fontWeight: 600, cursor: "pointer", listStyle: "none" }}>{a.q}</summary>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "8px 0 0", lineHeight: 1.5 }}>{a.a}</p>
            </details>
          ))}
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 500 }}>Browse topics</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
            {HELP_TOPICS.map((t) => (
              <button key={t.id} className="list-item" style={{ margin: 0 }} onClick={() => setOpenTopic(t)}>
                <div className="li-icon"><Icon name={t.icon} size={16} /></div>
                <div className="li-body"><div className="li-title">{t.title}</div><div className="li-meta">{t.articles.length} article{t.articles.length === 1 ? "" : "s"}</div></div>
                <Icon name="chevron" size={14} stroke={1.5} />
              </button>
            ))}
          </div>
          <div style={{ padding: 16, background: "var(--cream)", borderRadius: 12 }}>
            <strong style={{ fontSize: 14 }}>Still need help?</strong>
            <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "6px 0 12px" }}>Our team replies within one business day.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ width: "auto", flex: 1 }} onClick={() => { push("A new email draft has been opened.", "success"); onClose(); }}>
                <Icon name="mail" size={14} stroke={2} /> Email support
              </button>
              <button className="btn-secondary" style={{ width: "auto", flex: 1 }} onClick={() => push("Live chat with PetAid support coming soon.")}>
                <Icon name="chat" size={14} /> Live chat
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
