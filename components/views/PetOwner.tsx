"use client";

/* Pet Owner dashboard — 1:1 port of views/20-pet-owner.jsx, wired to the API.
   Covers SRS §7.1/7.2/7.4/7.5/7.6/7.7. */
import Image from "next/image";
import { useEffect, useState } from "react";
import { ApiError, petaid, usePetAid, money, PLATFORM_CURRENCY, type Chat, type Guidance, type PetOwnerPanels, type Quiz, type Resource, type Snapshot } from "@/lib/petaid";
import { BusyButton, Field, Icon, Modal, StarRow, clickable, relTime, maskReference, useToast } from "@/components/ui";
import { TopbarActions } from "./Popovers";
import { Settings } from "./Settings";
import { HelpCenter } from "./Help";

const SCENARIO_ICONS: Record<string, string> = {
  cardiac: "heart", poisoning: "alert", bleeding: "droplet", heatstroke: "thermometer", choking: "bone",
};
const RES_ICON = (t: string) => (t === "video" ? "book" : t === "images" || t === "image" ? "paw" : "book");

/* ---------- Sidebar ---------- */
function POSidebar({ active, setActive, panels, account, onLogout, open, onClose }: any) {
  const go = (id: string) => { setActive(id); onClose?.(); };
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark"><Image src="/petaid-logo.png" alt="PetAid" width={36} height={36} /></div>
        <div>
          <div className="brand-name">PetAid</div>
          <div className="brand-role">Pet Owner</div>
        </div>
      </div>
      <nav className="nav">
        {[
          { id: "dashboard", label: "Dashboard", icon: "dashboard" },
          { id: "pets", label: "My Pets", icon: "paw", count: panels.pets.length },
          { id: "guidance", label: "First Aid Library", icon: "first_aid", count: panels.guidance.length },
          { id: "resources", label: "Resources", icon: "book", count: panels.resources.length },
          { id: "quizzes", label: "Quizzes", icon: "quiz", count: panels.quizzes.length },
          { id: "inquiries", label: "Inquiries", icon: "mail", count: panels.inquiries.length },
          { id: "chats", label: "Vet Chat", icon: "chat" },
          { id: "donations", label: "Donations", icon: "gift" },
        ].map((it: any) => (
          <button key={it.id} className={`nav-item ${active === it.id ? "active" : ""}`} onClick={() => go(it.id)}>
            <Icon name={it.icon} size={16} />
            <span>{it.label}</span>
            {it.count != null && it.count > 0 && <span className="nav-count">{it.count}</span>}
          </button>
        ))}
      </nav>
      <div>
        <div className="section-label">My Pets</div>
        <div className="nav">
          {panels.pets.map((p: any) => (
            <div className="member" key={p.id}>
              <div className="member-avatar">{p.emoji}</div>
              <div className="member-info">
                <div className="member-name">{p.name}</div>
                <div className="member-role">{p.breed || "Pet"} · {p.age} yr</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="profile-row">
        <div className="avatar">{account.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}</div>
        <div className="name">{account.name}<span>{account.email || "alwin@petaid.com"}</span></div>
        <button className="logout" title="Sign out" aria-label="Sign out" onClick={onLogout}><Icon name="sign_out" size={14} /></button>
      </div>
    </aside>
  );
}

/* ---------- Hero ---------- */
function PreparednessGauge({ value = 0 }: { value?: number }) {
  const cx = 110, cy = 95, r = 80, ticks = 38, arc = Math.PI;
  const filled = Math.round((value / 100) * ticks);
  return (
    <svg width="220" height="118" viewBox="0 0 220 118">
      {Array.from({ length: ticks }).map((_, i) => {
        const t = i / (ticks - 1);
        const a = Math.PI + t * arc;
        const x1 = cx + Math.cos(a) * (r - 14), y1 = cy + Math.sin(a) * (r - 14);
        const x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
        const on = i < filled;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? "#FA7956" : "#d8d8d8"} strokeWidth={on ? 2 : 1.2} strokeLinecap="round" />;
      })}
    </svg>
  );
}

function POHero({ stats }: { stats: PetOwnerPanels["stats"] }) {
  const counts = [
    { day: "Mon", val: 1, alt: false }, { day: "Tue", val: 3, alt: false }, { day: "Wed", val: 1, alt: true },
    { day: "Thu", val: 0, alt: false }, { day: "Fri", val: 2, alt: false },
  ];
  const maxBar = Math.max(...counts.map((c) => c.val), 3);
  return (
    <div className="hero">
      <div>
        <div className="hero-block-label">Quizzes this week</div>
        <div className="bars-chart">
          <div className="bars-y"><span>{maxBar}</span><span>{Math.round(maxBar / 2)}</span><span>0</span></div>
          <div className="bars-canvas">
            {counts.map((b) => (
              <div className="bar-col" key={b.day}>
                <div className={`bar ${b.alt ? "alt" : ""}`} style={{ height: `${(b.val / maxBar) * 100}%` }} />
                <div className="bar-label">{b.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="gauge">
        <PreparednessGauge value={stats.preparedness} />
        <div className="gauge-center"><div className="pct">{stats.preparedness}%</div><div className="lbl">Preparedness</div></div>
      </div>
      <div className="hero-stat"><div className="num">{stats.guidanceSessions}</div><div className="meta">Guidance<br />sessions</div></div>
      <div className="hero-div" />
      <div className="hero-stat"><div className="num pct">{stats.avgScore}</div><div className="meta"><span>Avg quiz<br />score</span></div></div>
      <div className="hero-div" />
      <div className="hero-stat"><div className="num">{stats.moduleCount}</div><div className="meta"><span>Modules<br />available</span></div></div>
    </div>
  );
}

/* ---------- Pets ---------- */
function PetsRow({ pets, onAdd }: any) {
  return (
    <div className="pets-row">
      {pets.map((p: any) => (
        <div className="pet-card" key={p.id}>
          <div className="pet-avatar-lg">{p.emoji}</div>
          <div className="pet-info">
            <div className="pet-name-lg">{p.name}</div>
            <div className="pet-meta-lg">{p.breed || "—"} · {p.age} yr</div>
          </div>
        </div>
      ))}
      <button className="add-pet" onClick={onAdd}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Icon name="plus" size={16} stroke={1.8} /><span>Add pet</span>
        </div>
      </button>
    </div>
  );
}

function AddPetModal({ petTypes, onClose, onSubmit }: any) {
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState(petTypes[0]?.id || "");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("1");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = async () => {
    setErrors({});
    try {
      await onSubmit({ name, typeId, breed, age: Number(age) });
    } catch (e) {
      if (e instanceof ApiError && e.field) setErrors({ [e.field]: e.message });
      else setErrors({ form: e instanceof Error ? e.message : "Failed" });
    }
  };
  return (
    <Modal title="Add a pet" subtitle="Pet Type drives which guidance and quizzes you see." onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Adding…">Add pet</BusyButton></>}>
      <Field label="Pet name" error={errors.name}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mochi" maxLength={60} />
      </Field>
      <Field label="Pet type">
        <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          {petTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Age (years)">
        <input value={age} onChange={(e) => setAge(e.target.value)} type="number" min="0" max="30" />
      </Field>
      <Field label="Breed">
        <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Golden Retriever" maxLength={60} />
      </Field>
      {errors.form && <div className="banner error">{errors.form}</div>}
    </Modal>
  );
}

/* ---------- Emergency drawer ---------- */
function EmergencyDrawer({ onClose, guidance }: { onClose: () => void; guidance: Guidance[] }) {
  const [active, setActive] = useState<Guidance | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div><div className="live">Live triage</div><h2>{active ? active.title : "Emergency First Aid"}</h2></div>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={14} stroke={2} /></button>
        </div>
        <div className="drawer-body">
          {!active && (
            <>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                Pick a scenario · works offline
              </div>
              {guidance.map((g) => (
                <button className="scenario" key={g.id} onClick={() => { setActive(g); setDone(new Set()); }}>
                  <div className="scenario-icon"><Icon name={SCENARIO_ICONS[g.emergencyType] || "first_aid"} size={18} /></div>
                  <div className="scenario-text"><strong>{g.title}</strong><span>{g.steps.length} steps · pet-type filtered</span></div>
                  <div className="scenario-time">→</div>
                </button>
              ))}
              {guidance.length === 0 && <div className="empty-state"><strong>No matching guidance.</strong>Add a pet to filter content.</div>}
            </>
          )}
          {active && (
            <>
              <button className="btn-ghost" style={{ width: "fit-content", marginBottom: 8 }} onClick={() => setActive(null)}>
                <Icon name="arrow_left" size={13} /> Back to scenarios
              </button>
              <ol className="steps-list">
                {active.steps.map((step, i) => (
                  <li key={i} className={done.has(i) ? "done" : ""} onClick={() => { const n = new Set(done); n.has(i) ? n.delete(i) : n.add(i); setDone(n); }}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

/* ---------- Inquiry / Quiz / Donation / Chat / Feedback modals ---------- */
const StatusPill = ({ status }: { status: string }) => {
  const cls = status === "pending" ? "warning" : status === "responded" || status === "active" ? "success" : "";
  return <span className={`tag-pill ${cls}`}>{status}</span>;
};

function NewInquiryModal({ onClose, onSubmit }: any) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setError(null);
    try { await onSubmit(question); } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };
  return (
    <Modal title="Submit an inquiry" subtitle="A veterinary expert will respond within the dashboard." onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Submitting…">Submit</BusyButton></>}>
      <Field label="Your question" error={error} hint="Up to 1000 characters.">
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Describe the situation, your pet's symptoms, and any timing details…" rows={6} maxLength={1000} style={{ padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, resize: "vertical" }} />
      </Field>
    </Modal>
  );
}

function InquiryDetailModal({ inquiry, onClose }: any) {
  return (
    <Modal title="Inquiry detail" subtitle={`Submitted ${relTime(inquiry.createdAt)} · ${inquiry.status}`} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500, marginBottom: 4 }}>YOUR QUESTION</div>
        <div style={{ padding: 12, background: "var(--gray)", borderRadius: 10, fontSize: 13.5 }}>{inquiry.question}</div>
      </div>
      {inquiry.response ? (
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500, marginBottom: 4 }}>VET RESPONSE</div>
          <div style={{ padding: 12, background: "var(--cream)", borderRadius: 10, fontSize: 13.5 }}>{inquiry.response}</div>
        </div>
      ) : (
        <div className="banner info">Awaiting vet response — typical response time under 24h.</div>
      )}
    </Modal>
  );
}

function QuizModal({ quiz, onClose, onSubmit }: { quiz: Quiz; onClose: () => void; onSubmit: (a: number[]) => Promise<any> }) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setError(null);
    if (answers.some((a) => a === null)) { setError("Please answer every question before submitting."); return; }
    try { setResult(await onSubmit(answers as number[])); } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };
  if (result) {
    return (
      <Modal title={result.passed ? "Quiz passed" : "Keep practising"} subtitle={`You scored ${result.score}% on “${quiz.title}”.`} onClose={onClose}
        footer={<button className="btn-primary" onClick={onClose}>Close</button>}>
        <div className="banner success" style={{ marginBottom: 14 }}>{result.passed ? "Saved as your best score for this topic." : "Try again — your best score is kept."}</div>
        {(result.perQuestion || []).map((r: any, i: number) => (
          <div key={i} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{i + 1}. {r.prompt}</div>
            <div style={{ fontSize: 12.5, color: r.ok ? "var(--success)" : "var(--danger)" }}>
              Your answer: {r.given}{!r.ok && <> · Correct: <strong>{r.correct}</strong></>}
            </div>
          </div>
        ))}
      </Modal>
    );
  }
  return (
    <Modal title={quiz.title} subtitle={`${quiz.questions.length} questions · pass at ${quiz.passingScore}%`} onClose={onClose} wide
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Submitting…">Submit answers</BusyButton></>}>
      {quiz.questions.map((q, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{i + 1}. {q.prompt}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {q.choices.map((c, ci) => (
              <label key={ci} style={{ padding: "10px 14px", border: `1.5px solid ${answers[i] === ci ? "var(--accent)" : "var(--line-2)"}`, background: answers[i] === ci ? "var(--accent-soft)" : "var(--white)", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <input type="radio" name={`q${i}`} checked={answers[i] === ci} onChange={() => { const a = [...answers]; a[i] = ci; setAnswers(a); }} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {error && <div className="banner error">{error}</div>}
    </Modal>
  );
}

function DonationModal({ donations, onClose, onSubmit }: any) {
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const presets = [10, 25, 50, 100];
  const submit = async () => {
    setError(null);
    const final = custom ? Number(custom) : amount;
    try { setResult(await onSubmit(final, recurring)); } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };
  if (result) {
    const ok = result.success;
    return (
      <Modal title={ok ? "Thank you for your support" : "Payment could not be processed"} subtitle={ok ? `${money(result.amount)} received.` : "You haven't been charged."} onClose={onClose}
        footer={<button className="btn-primary" onClick={onClose}>Close</button>}>
        {ok ? (
          <>
            <div className="banner success">Confirmation reference: <code style={{ fontFamily: "var(--font-mono)" }}>{maskReference(result.reference)}</code></div>
            <div style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-2)" }}>Your contribution helps the Veterinary Association maintain free first-aid resources for everyone.</div>
          </>
        ) : (
          <div className="banner error">{result.error || "Payment failed."}</div>
        )}
      </Modal>
    );
  }
  return (
    <Modal title="Make a donation" subtitle="100 % goes to the Veterinary Association." onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Processing…">Donate</BusyButton></>}>
      <Field label="Amount (MYR)">
        <div className="amount-grid">
          {presets.map((p) => <button key={p} type="button" className={!custom && amount === p ? "selected" : ""} onClick={() => { setAmount(p); setCustom(""); }}>{money(p)}</button>)}
        </div>
        <input value={custom} onChange={(e) => setCustom(e.target.value)} type="number" min="1" placeholder="Custom amount" />
      </Field>
      <Field label="Make this a monthly recurring donation">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} /> Repeat this donation every month
        </label>
      </Field>
      <Field label="Payment method" hint="Demo only — no charge is processed.">
        <select><option>Saved card on file</option><option>Touch &apos;n Go eWallet</option><option>Online banking</option></select>
      </Field>
      {error && <div className="banner error">{error}</div>}
      {donations.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-3)" }}>
          Total donated to date: <strong style={{ color: "var(--ink)" }}>{money(donations.filter((d: any) => d.status === "succeeded").reduce((s: number, d: any) => s + d.amount, 0))}</strong> across {donations.length} contribution{donations.length === 1 ? "" : "s"}.
        </div>
      )}
    </Modal>
  );
}

function ChatModal({ chat, myId, onClose, onSend, onCloseChat }: { chat: Chat; myId: string; onClose: () => void; onSend: (t: string) => Promise<void>; onCloseChat: () => Promise<void> }) {
  const [text, setText] = useState("");
  const send = async () => {
    if (!text.trim()) return;
    const t = text;
    setText("");
    await onSend(t);
  };
  return (
    <Modal title="Chat with the vet team" subtitle={`Status: ${chat.status}`} onClose={onClose} wide
      footer={<button className="btn-secondary" onClick={onCloseChat}>End chat</button>}>
      {chat.status === "initiated" && <div className="banner info">Waiting for a vet to join. Switch to the Vet account to demo the other side.</div>}
      <div className="chat-window">
        <div className="chat-messages">
          {chat.messages.length === 0 && <div style={{ color: "var(--ink-3)", fontSize: 12, textAlign: "center", padding: 20 }}>Send the first message to start the conversation.</div>}
          {chat.messages.map((m) => <div key={m.id} className={`chat-bubble ${m.senderId === myId ? "mine" : "theirs"}`}>{m.text}</div>)}
        </div>
        <div className="chat-input">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" onKeyDown={(e) => e.key === "Enter" && send()} />
          <BusyButton className="" onClick={send}><Icon name="send" size={14} /></BusyButton>
        </div>
      </div>
    </Modal>
  );
}

function FeedbackModal({ target, onClose, onSubmit }: any) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setError(null);
    if (rating === 0) { setError("Please pick a star rating."); return; }
    try { await onSubmit({ rating, comment, flagged }); } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };
  return (
    <Modal title={`Rate “${target.title}”`} subtitle="Your feedback helps vets improve the content." onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Submitting…">Submit feedback</BusyButton></>}>
      <Field label="Rating"><StarRow value={rating} onChange={setRating} /></Field>
      <Field label="Comment (optional)" hint="Up to 500 characters.">
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={500} placeholder="What was useful, what could be clearer?" style={{ padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, resize: "vertical" }} />
      </Field>
      <Field label="Flag for vet review">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} /> This content needs attention (will alert the vet team)
        </label>
      </Field>
      {error && <div className="banner error">{error}</div>}
    </Modal>
  );
}

/* ===================================================================
   Shell
=================================================================== */
export function PetOwner({ snapshot }: { snapshot: Snapshot }) {
  const { refresh } = usePetAid();
  const { push } = useToast();
  const panels = snapshot.dashboard!.panels as PetOwnerPanels;
  const header = snapshot.dashboard!.header;
  const account = snapshot.account!;

  const [active, setActive] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [openInquiry, setOpenInquiry] = useState<any>(null);
  const [openQuiz, setOpenQuiz] = useState<Quiz | null>(null);
  const [showDonation, setShowDonation] = useState(false);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<Resource | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState("profile");
  const [showHelp, setShowHelp] = useState(false);

  // Poll while a chat is open so the vet's replies arrive.
  useEffect(() => {
    if (!openChatId) return;
    const t = setInterval(() => refresh(), 3000);
    return () => clearInterval(t);
  }, [openChatId, refresh]);

  const openChat = openChatId ? panels.chats.find((c) => c.id === openChatId) || null : null;

  /* handlers */
  const handleAddPet = async (d: any) => {
    await petaid.addPet({ name: d.name, pet_type_id: d.typeId, breed: d.breed, age_years: d.age, health_notes: "" });
    await refresh();
    setShowAddPet(false);
    push("Pet added.", "success");
  };
  const handleNewInquiry = async (q: string) => {
    await petaid.submitInquiry(q.slice(0, 120) || "Inquiry", q);
    await refresh();
    setShowInquiry(false);
    push("Inquiry sent. A vet will respond soon.", "success");
  };
  const handleQuizSubmit = async (answers: number[]) => {
    const r = await petaid.submitQuiz(openQuiz!.id, answers);
    await refresh();
    return { score: r.score_pct, passed: r.passed, perQuestion: (r as any).per_question };
  };
  const handleDonate = async (amount: number, recurring: boolean) => {
    try {
      const d = await petaid.donate(Math.round(amount * 100), PLATFORM_CURRENCY, recurring);
      await refresh();
      return { success: true, amount: d.amount_cents / 100, reference: d.transaction_ref };
    } catch (e) {
      if (e instanceof ApiError) return { success: false, error: e.message };
      throw e;
    }
  };
  const handleStartChat = async () => {
    try {
      const c = await petaid.startChat("Vet chat");
      await refresh();
      setOpenChatId(c.id);
    } catch (e) {
      push(e instanceof Error ? e.message : "Couldn't start the chat. Please try again.", "danger");
    }
  };
  const handleSendChat = async (t: string) => {
    if (!openChatId) return;
    try {
      await petaid.postChatMessage(openChatId, t);
      await refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : "Message failed to send.", "danger");
    }
  };
  const handleCloseChat = async () => {
    if (!openChatId) return;
    try {
      await petaid.closeChat(openChatId);
      await refresh();
      setOpenChatId(null);
    } catch (e) {
      push(e instanceof Error ? e.message : "Couldn't close the chat.", "danger");
    }
  };
  const handleFeedback = async ({ rating, comment, flagged }: any) => {
    await petaid.submitFeedback({ target_type: "resource", target_id: feedbackTarget!.id, rating, comment, flagged });
    await refresh();
    setFeedbackTarget(null);
    push("Thanks for the feedback!", "success");
  };
  const onLogout = () => { void petaid.logout(); };

  const onAction = (a: { type: string; payload?: string; section?: string }) => {
    if (a.type === "open_inquiry") { const i = panels.inquiries.find((x) => x.id === a.payload); if (i) { setActive("inquiries"); setOpenInquiry(i); } }
    else if (a.type === "open_chat") { setActive("chats"); setOpenChatId(a.payload || null); }
    else if (a.type === "open_settings") { setSettingsSection(a.section || "profile"); setShowSettings(true); }
    else if (a.type === "open_help") setShowHelp(true);
    else push("Coming soon.");
  };

  if (showSettings) {
    return <Settings account={account} initialSection={settingsSection} onClose={() => setShowSettings(false)} onLogout={onLogout} />;
  }

  const titleMap: Record<string, string> = { dashboard: "Overview", pets: "My Pets", guidance: "First Aid Library", resources: "Resources", quizzes: "Quizzes", inquiries: "Inquiries", chats: "Vet Chat", donations: "Donations" };

  return (
    <>
      <div className="app-shell">
        <div className={`nav-backdrop ${navOpen ? "open" : ""}`} onClick={() => setNavOpen(false)} aria-hidden="true" />
        <POSidebar active={active} setActive={setActive} panels={panels} account={account} onLogout={onLogout} open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="main">
          <div className="topbar">
            <button className="nav-toggle" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Icon name="menu" size={18} /></button>
            <h1>{header.greeting} <span>· {titleMap[active] || "Overview"}</span></h1>
            <div className="grow" />
            <button className="emergency-btn" onClick={() => setShowEmergency(true)}><Icon name="alert" size={14} stroke={2} /> Emergency</button>
            <TopbarActions snapshot={snapshot} onAction={onAction} onSignOut={onLogout} />
          </div>

          {active === "dashboard" && (
            <>
              <POHero stats={panels.stats} />
              <div className="section-title"><h2>Your pets</h2><button className="btn-ghost" onClick={() => setShowAddPet(true)}><Icon name="plus" size={12} stroke={2} /> Add pet</button></div>
              <PetsRow pets={panels.pets} onAdd={() => setShowAddPet(true)} />
              <div className="section-title"><h2>Quick actions</h2></div>
              <div style={{ padding: "0 28px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { id: "quiz", icon: "quiz", label: "Take a quiz", sub: `${panels.quizzes.length} available`, onClick: () => setActive("quizzes") },
                  { id: "inquiry", icon: "mail", label: "Ask a vet", sub: "Asynchronous reply", onClick: () => setShowInquiry(true) },
                  { id: "chat", icon: "chat", label: "Start chat", sub: "Live with a vet", onClick: handleStartChat },
                  { id: "donate", icon: "gift", label: "Donate", sub: "Support the cause", onClick: () => setShowDonation(true) },
                ].map((a) => (
                  <button key={a.id} onClick={a.onClick} style={{ padding: 18, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 14, textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--cream)", display: "grid", placeItems: "center" }}><Icon name={a.icon} size={16} /></div>
                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</div><div style={{ fontSize: 12, color: "var(--ink-3)" }}>{a.sub}</div></div>
                  </button>
                ))}
              </div>
              <div className="section-title"><h2>Recent inquiries</h2><button className="btn-ghost" onClick={() => setActive("inquiries")}>View all</button></div>
              <div style={{ padding: "0 28px" }}>
                {panels.inquiries.slice(0, 3).map((i) => (
                  <div className="list-item" key={i.id} {...clickable(() => setOpenInquiry(i))}>
                    <div className="li-icon"><Icon name="mail" size={15} /></div>
                    <div className="li-body"><div className="li-title">{i.question.slice(0, 80)}{i.question.length > 80 ? "…" : ""}</div><div className="li-meta"><StatusPill status={i.status} /> · {relTime(i.createdAt)}</div></div>
                  </div>
                ))}
                {panels.inquiries.length === 0 && <div className="empty-state"><strong>No inquiries yet.</strong>Tap &quot;Ask a vet&quot; to send your first one.</div>}
              </div>
            </>
          )}

          {active === "pets" && (
            <>
              <div className="section-title"><h2>My pets</h2><button className="btn-ink" onClick={() => setShowAddPet(true)}><Icon name="plus" size={13} stroke={2} /> Add pet</button></div>
              <PetsRow pets={panels.pets} onAdd={() => setShowAddPet(true)} />
            </>
          )}

          {active === "guidance" && (
            <>
              <div className="section-title"><h2>First aid library</h2></div>
              <div style={{ padding: "0 28px" }}>
                {panels.guidance.map((g) => (
                  <div className="list-item" key={g.id} {...clickable(() => setShowEmergency(true))}>
                    <div className="li-icon"><Icon name={SCENARIO_ICONS[g.emergencyType] || "first_aid"} size={16} /></div>
                    <div className="li-body"><div className="li-title">{g.title}</div><div className="li-meta">{g.steps.length} steps · {g.emergencyType}</div></div>
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "resources" && (
            <>
              <div className="section-title"><h2>Connected resources</h2></div>
              <div style={{ padding: "0 28px" }}>
                {panels.resources.map((r) => (
                  <div className="list-item" key={r.id}>
                    <div className="li-icon"><Icon name={RES_ICON(r.contentType)} size={16} /></div>
                    <div className="li-body"><div className="li-title">{r.title}</div><div className="li-meta">{r.contentType.toUpperCase()} · {r.status}</div></div>
                    <button className="btn-ghost" onClick={() => setFeedbackTarget(r)}><Icon name="star" size={13} /> Rate</button>
                  </div>
                ))}
                {panels.resources.length === 0 && <div className="empty-state"><strong>No resources yet.</strong></div>}
              </div>
            </>
          )}

          {active === "quizzes" && (
            <>
              <div className="section-title"><h2>Quizzes</h2></div>
              <div style={{ padding: "0 28px" }}>
                {panels.quizzes.map((q) => (
                  <div className="list-item" key={q.id} {...clickable(() => setOpenQuiz(q))}>
                    <div className="li-icon"><Icon name="quiz" size={16} /></div>
                    <div className="li-body"><div className="li-title">{q.title}</div><div className="li-meta">{q.questions.length} questions · pass at {q.passingScore}%</div></div>
                    {(() => {
                      const mine = panels.attempts.filter((a) => a.quizId === q.id);
                      if (!mine.length) return null;
                      const best = Math.max(...mine.map((a) => a.score));
                      const passed = best >= q.passingScore;
                      return <span className="best-score" style={{ color: passed ? "var(--success)" : "var(--ink-3)", borderColor: passed ? "var(--success)" : "var(--line-2)" }}>Best {best}%</span>;
                    })()}
                  </div>
                ))}
                {panels.quizzes.length === 0 && <div className="empty-state"><strong>No quizzes yet.</strong></div>}
              </div>
            </>
          )}

          {active === "inquiries" && (
            <>
              <div className="section-title"><h2>Your inquiries</h2><div className="actions"><button className="btn-ink" onClick={() => setShowInquiry(true)}><Icon name="plus" size={13} stroke={2} /> New inquiry</button></div></div>
              <div style={{ padding: "0 28px" }}>
                {panels.inquiries.length === 0 && <div className="empty-state"><strong>No inquiries yet.</strong>Submit one and a vet will respond.</div>}
                {panels.inquiries.map((i) => (
                  <div className="list-item" key={i.id} {...clickable(() => setOpenInquiry(i))}>
                    <div className="li-icon"><Icon name="mail" size={16} /></div>
                    <div className="li-body"><div className="li-title">{i.question.slice(0, 90)}{i.question.length > 90 ? "…" : ""}</div><div className="li-meta"><StatusPill status={i.status} /> · submitted {relTime(i.createdAt)}{i.respondedAt ? ` · responded ${relTime(i.respondedAt)}` : ""}</div></div>
                    <Icon name="chevron" size={14} stroke={1.5} />
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "chats" && (
            <>
              <div className="section-title"><h2>Vet chat</h2><button className="btn-ink" onClick={handleStartChat}><Icon name="plus" size={13} stroke={2} /> Start new chat</button></div>
              <div style={{ padding: "0 28px" }}>
                {panels.chats.length === 0 && <div className="empty-state"><strong>No chats yet.</strong></div>}
                {panels.chats.map((c) => (
                  <div className="list-item" key={c.id} {...clickable(() => setOpenChatId(c.id))}>
                    <div className="li-icon"><Icon name="chat" size={16} /></div>
                    <div className="li-body"><div className="li-title">{c.subject || "Vet chat"} · {c.messages.length} messages</div><div className="li-meta">{c.status} · started {relTime(c.startedAt)}</div></div>
                    <StatusPill status={c.status} />
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "donations" && (
            <>
              <div className="section-title"><h2>Donations</h2><button className="btn-ink" onClick={() => setShowDonation(true)}><Icon name="plus" size={13} stroke={2} /> Donate</button></div>
              <div style={{ padding: "0 28px" }}>
                {panels.donations.length === 0 && <div className="empty-state"><strong>No donations yet.</strong></div>}
                {panels.donations.map((d) => (
                  <div className="list-item" key={d.id}>
                    <div className="li-icon"><Icon name="gift" size={15} /></div>
                    <div className="li-body"><div className="li-title">{money(d.amount, d.currency)}</div><div className="li-meta">{d.reference ? maskReference(d.reference) : "—"}{d.at ? ` · ${relTime(d.at)}` : ""}</div></div>
                    <span className={`tag-pill ${d.status === "succeeded" ? "success" : d.status === "failed" ? "danger" : "warning"}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ height: 60 }} />
        </main>
      </div>

      {showEmergency && <EmergencyDrawer onClose={() => setShowEmergency(false)} guidance={panels.guidance} />}
      {showAddPet && <AddPetModal petTypes={panels.petTypes} onClose={() => setShowAddPet(false)} onSubmit={handleAddPet} />}
      {showInquiry && <NewInquiryModal onClose={() => setShowInquiry(false)} onSubmit={handleNewInquiry} />}
      {openInquiry && <InquiryDetailModal inquiry={openInquiry} onClose={() => setOpenInquiry(null)} />}
      {openQuiz && <QuizModal quiz={openQuiz} onClose={() => setOpenQuiz(null)} onSubmit={handleQuizSubmit} />}
      {showDonation && <DonationModal donations={panels.donations} onClose={() => setShowDonation(false)} onSubmit={handleDonate} />}
      {openChat && <ChatModal chat={openChat} myId={account.id} onClose={() => setOpenChatId(null)} onSend={handleSendChat} onCloseChat={handleCloseChat} />}
      {feedbackTarget && <FeedbackModal target={feedbackTarget} onClose={() => setFeedbackTarget(null)} onSubmit={handleFeedback} />}
      {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
    </>
  );
}
