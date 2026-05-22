"use client";

/* Veterinary Expert admin dashboard — 1:1 port of views/30-vet-expert.jsx.
   Covers SRS §7.2 (respond), §7.3 (publish resource), §7.6 (chat). */
import Image from "next/image";
import { useEffect, useState } from "react";
import { ApiError, petaid, usePetAid, money, PLATFORM_CURRENCY, type Chat, type Snapshot, type VetPanels } from "@/lib/petaid";
import { BusyButton, Field, Icon, Modal, clickable, relTime, maskReference, useToast } from "@/components/ui";
import { TopbarActions } from "./Popovers";
import { Settings } from "./Settings";
import { HelpCenter } from "./Help";

const SCENARIO_ICONS: Record<string, string> = { cardiac: "heart", poisoning: "alert", bleeding: "droplet", heatstroke: "thermometer", choking: "bone" };

function AdminSidebar({ active, setActive, panels, account, onLogout, open, onClose, query, setQuery }: any) {
  const go = (id: string) => { setActive(id); onClose?.(); };
  const items = [
    { id: "overview", label: "Overview", icon: "dashboard", count: 0 },
    { id: "inquiries", label: "Inquiries", icon: "mail", count: panels.inquiriesByStatus.pending.length, attention: panels.inquiriesByStatus.pending.length > 0 },
    { id: "chats", label: "Live chats", icon: "chat", count: panels.activeChats.length, attention: panels.activeChats.some((c: Chat) => c.status === "initiated") },
    { id: "resources", label: "Resources", icon: "book", count: panels.resources.length },
    { id: "guidance", label: "Guidance library", icon: "first_aid", count: panels.guidance.length },
    { id: "feedback", label: "Feedback", icon: "star", count: panels.flaggedFeedback.length, attention: panels.flaggedFeedback.length > 0 },
    { id: "donations", label: "Donations", icon: "gift", count: panels.donations.length },
  ];
  const renderItem = (it: any) => {
    const cls = ["nav-item"];
    if (active === it.id) cls.push("active");
    if (it.attention) cls.push("has-attention");
    return (
      <button key={it.id} className={cls.join(" ")} onClick={() => go(it.id)}>
        <Icon name={it.icon} size={16} /><span>{it.label}</span>{it.count > 0 && <span className="nav-count">{it.count}</span>}
      </button>
    );
  };
  return (
    <aside className={`admin-sidebar ${open ? "open" : ""}`}>
      <div className="admin-brand">
        <div className="brand-mark"><Image src="/petaid-logo.png" alt="PetAid" width={36} height={36} /></div>
        <div><div className="brand-name">PetAid</div><div className="pill-role">Admin · Vet</div></div>
      </div>
      <div className="admin-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search inquiries, resources…" aria-label="Search the current view" />
        {query ? <button className="kbd" onClick={() => setQuery("")} aria-label="Clear search" style={{ cursor: "pointer" }}>✕</button> : <span className="kbd">⌘K</span>}
      </div>
      <nav className="admin-nav">
        <div className="group-label">Workspace</div>
        {items.slice(0, 3).map(renderItem)}
        <div className="group-label">Content</div>
        {items.slice(3, 5).map(renderItem)}
        <div className="group-label">Insights</div>
        {items.slice(5).map(renderItem)}
      </nav>
      <div className="profile-row">
        <div className="avatar">{account.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}</div>
        <div className="name">Dr. {account.name}<span>{account.speciality || "Veterinary expert"}</span></div>
        <button className="logout" title="Sign out" aria-label="Sign out" onClick={() => { if (window.confirm("Sign out of PetAid?")) onLogout(); }}><Icon name="sign_out" size={14} /></button>
      </div>
    </aside>
  );
}

function KpiSparkline({ color = "currentColor", values = [3, 4, 3, 5, 6, 5, 7, 8, 7, 9] }: { color?: string; values?: number[] }) {
  const w = 80, h = 28, max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return <svg className="kpi-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"><polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SlaChart() {
  const w = 360, h = 100, pad = { l: 30, r: 8, t: 10, b: 22 };
  const data = [88, 92, 90, 94, 91, 95, 92], days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const xAt = (i: number) => pad.l + (i / (data.length - 1)) * cw;
  const yAt = (v: number) => pad.t + (1 - (v - 80) / 20) * ch;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(v)}`).join(" ");
  const area = path + ` L${xAt(data.length - 1)},${h - pad.b} L${xAt(0)},${h - pad.b} Z`;
  return (
    <div className="admin-chart">
      <svg viewBox={`0 0 ${w} ${h}`}>
        <defs><linearGradient id="slaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FA7956" stopOpacity="0.25" /><stop offset="100%" stopColor="#FA7956" stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2].map((i) => <line key={i} x1={pad.l} x2={w - pad.r} y1={pad.t + (ch / 2) * i} y2={pad.t + (ch / 2) * i} stroke="#ECECEC" strokeDasharray={i === 2 ? "0" : "2 4"} />)}
        {[100, 90, 80].map((v, i) => <text key={v} x={pad.l - 6} y={pad.t + (ch / 2) * i + 3} fontSize="9" fill="#8a8a8a" textAnchor="end" fontFamily="JetBrains Mono">{v}</text>)}
        <path d={area} fill="url(#slaGrad)" />
        <path d={path} stroke="#FA7956" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => <circle key={i} cx={xAt(i)} cy={yAt(v)} r={2.5} fill="#fff" stroke="#FA7956" strokeWidth="1.5" />)}
        {days.map((d, i) => <text key={d} x={xAt(i)} y={h - 6} fontSize="9" fill="#8a8a8a" textAnchor="middle" fontFamily="JetBrains Mono" letterSpacing="0.05em">{d.toUpperCase()}</text>)}
      </svg>
    </div>
  );
}

function AdminInquiryCard({ inquiry, onOpen }: any) {
  const isUrgent = /emergency|bleed|urgent|asap|help|now|dying|poison/i.test(inquiry.question);
  return (
    <div className="admin-inq-card" {...clickable(() => onOpen(inquiry))}>
      <div className="top"><span className={`priority ${isUrgent ? "urgent" : "normal"}`}>{isUrgent ? "Urgent" : "Normal"}</span><span className="topic">#{inquiry.id.slice(-5).toUpperCase()}</span></div>
      <div className="text">{inquiry.question.slice(0, 100)}{inquiry.question.length > 100 ? "…" : ""}</div>
      {inquiry.response && <div className="reply">↳ {inquiry.response.slice(0, 90)}{inquiry.response.length > 90 ? "…" : ""}</div>}
      <div className="foot"><span className="avatar">PO</span><span>Pet owner</span><span className="time">{relTime(inquiry.createdAt)}</span></div>
    </div>
  );
}

function RespondInquiryModal({ inquiry, onClose, onSubmit }: any) {
  const [response, setResponse] = useState(inquiry.response || "");
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setError(null);
    try { await onSubmit(response); } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };
  return (
    <Modal title="Respond to inquiry" subtitle={`Submitted ${relTime(inquiry.createdAt)} · status ${inquiry.status}`} onClose={onClose} wide
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Sending…">Send response</BusyButton></>}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 500, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Owner&apos;s question</div>
        <div style={{ padding: 14, background: "var(--gray)", borderRadius: 10, fontSize: 13.5, lineHeight: 1.5 }}>{inquiry.question}</div>
      </div>
      <Field label="Your response" hint="Plain language, clinically accurate. Up to 2000 characters.">
        <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={8} placeholder="Provide your professional guidance…" style={{ padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, resize: "vertical", fontSize: 13.5 }} />
      </Field>
      {error && <div className="banner error">{error}</div>}
    </Modal>
  );
}

function NewResourceModal({ petTypes, onClose, onSubmit }: any) {
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("doc");
  const [petTypeIds, setPetTypeIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const submit = async (publish: boolean) => {
    setErrors({});
    try { await onSubmit({ title, contentType, petTypeIds }, publish); onClose(); }
    catch (e) { if (e instanceof ApiError && e.field) setErrors({ [e.field]: e.message }); else setErrors({ form: e instanceof Error ? e.message : "Failed" }); }
  };
  return (
    <Modal title="New resource" subtitle="Create a content item grouped by Pet Type." onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-secondary" onClick={() => submit(false)} busyLabel="Saving…">Save draft</BusyButton><BusyButton className="btn-primary" onClick={() => submit(true)} busyLabel="Publishing…">Save &amp; publish</BusyButton></>}>
      <Field label="Title" error={errors.title}><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dog CPR — Step-by-Step Video" maxLength={120} /></Field>
      <Field label="Content type">
        <select value={contentType} onChange={(e) => setContentType(e.target.value)}><option value="doc">Document</option><option value="video">Video</option><option value="image">Image set</option></select>
      </Field>
      <Field label="Applies to pet types" hint="Pick one or more." error={errors.pet_type_id}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {petTypes.map((t: any) => {
            const on = petTypeIds.includes(t.id);
            return <button key={t.id} type="button" onClick={() => setPetTypeIds(on ? petTypeIds.filter((i) => i !== t.id) : [...petTypeIds, t.id])} style={{ padding: "6px 12px", borderRadius: 8, background: on ? "var(--accent)" : "var(--gray)", color: on ? "white" : "var(--ink-2)", fontSize: 12, fontWeight: 500 }}>{t.name}</button>;
          })}
        </div>
      </Field>
      <Field label="Attach media (optional)">
        <label style={{ padding: 14, border: "1.5px dashed var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <Icon name="upload" size={16} /><span style={{ fontSize: 13 }}>{fileName || "Click to choose a file (≤ 25 MB)"}</span>
          <input type="file" hidden onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} />
        </label>
      </Field>
      {errors.form && <div className="banner error">{errors.form}</div>}
    </Modal>
  );
}

function VetChatModal({ chat, myId, onClose, onSend, onCloseChat }: { chat: Chat; myId: string; onClose: () => void; onSend: (t: string) => Promise<void>; onCloseChat: () => Promise<void> }) {
  const [text, setText] = useState("");
  const send = async () => { if (!text.trim()) return; const t = text; setText(""); await onSend(t); };
  return (
    <Modal title="Chat with pet owner" subtitle={`Status: ${chat.status}`} onClose={onClose} wide
      footer={<button className="btn-secondary" onClick={onCloseChat}>End chat</button>}>
      {chat.status === "initiated" && <div className="banner info">Send your first message to join the session.</div>}
      <div className="chat-window">
        <div className="chat-messages">
          {chat.messages.map((m) => <div key={m.id} className={`chat-bubble ${m.senderId === myId ? "mine" : "theirs"}`}>{m.text}</div>)}
          {chat.messages.length === 0 && <div style={{ color: "var(--ink-3)", fontSize: 12, textAlign: "center", padding: 20 }}>No messages yet.</div>}
        </div>
        <div className="chat-input">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your response…" onKeyDown={(e) => e.key === "Enter" && send()} />
          <BusyButton className="" onClick={send}><Icon name="send" size={14} /></BusyButton>
        </div>
      </div>
    </Modal>
  );
}

export function VetExpert({ snapshot }: { snapshot: Snapshot }) {
  const { refresh } = usePetAid();
  const { push } = useToast();
  const panels = snapshot.dashboard!.panels as VetPanels;
  const account = snapshot.account!;

  const [active, setActive] = useState("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openInquiry, setOpenInquiry] = useState<any>(null);
  const [showNewResource, setShowNewResource] = useState(false);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState("profile");
  const [showHelp, setShowHelp] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState("all");
  const [petTypes, setPetTypes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => { petaid.petTypes().then((t) => setPetTypes(t.map((x) => ({ id: x.id, name: x.name })))).catch(() => {}); }, []);
  useEffect(() => {
    if (!openChatId) return;
    const t = setInterval(() => refresh(), 3000);
    return () => clearInterval(t);
  }, [openChatId, refresh]);

  const openChat = openChatId ? panels.activeChats.find((c) => c.id === openChatId) || null : null;
  const onLogout = () => { void petaid.logout(); };

  const respondInquiry = async (text: string) => {
    await petaid.respondInquiry(openInquiry.id, text);
    await refresh();
    setOpenInquiry(null);
    push("Response sent.", "success");
  };
  const createAndMaybePublish = async (data: any, publish: boolean) => {
    const ctMap: Record<string, string> = { doc: "pdf", image: "images", video: "video" };
    const petTypeId = data.petTypeIds[0] || petTypes[0]?.id;
    if (!petTypeId) throw new ApiError(422, { code: "invalid_input", detail: "Pick at least one pet type.", field: "pet_type_id" });
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const r = await petaid.createResource({
      title: data.title, content_type: ctMap[data.contentType] || "pdf",
      pet_type_id: petTypeId, media_path: `https://media.petaid.app/${slug}.${data.contentType === "video" ? "mp4" : data.contentType === "image" ? "png" : "pdf"}`, size_bytes: 1024,
    });
    if (publish) await petaid.publishResource((r as any).id);
    await refresh();
    push(publish ? "Resource published." : "Draft saved.", "success");
  };
  const publishResource = async (id: string) => { await petaid.publishResource(id); await refresh(); push("Resource published.", "success"); };
  const handleSendChat = async (t: string) => {
    if (!openChatId) return;
    if (openChat?.status === "initiated") await petaid.joinChat(openChatId);
    await petaid.postChatMessage(openChatId, t);
    await refresh();
  };
  const handleCloseChat = async () => { if (openChatId) { await petaid.closeChat(openChatId); await refresh(); setOpenChatId(null); } };

  const onAction = (a: { type: string; payload?: string; section?: string }) => {
    if (a.type === "open_inquiry_vet") { const i = panels.inquiriesByStatus.pending.find((x) => x.id === a.payload); if (i) { setActive("inquiries"); setOpenInquiry(i); } }
    else if (a.type === "open_chat_vet") { setActive("chats"); setOpenChatId(a.payload || null); }
    else if (a.type === "open_settings") { setSettingsSection(a.section || "profile"); setShowSettings(true); }
    else if (a.type === "open_help") setShowHelp(true);
    else push("Coming soon.");
  };

  if (showSettings) return <Settings account={account} initialSection={settingsSection} onClose={() => setShowSettings(false)} />;

  const pendingCount = panels.inquiriesByStatus.pending.length;
  const publishedRes = panels.resources.filter((r) => r.status === "published").length;
  // Group by currency so a mixed-currency dataset never sums into a single
  // meaningless figure (DEF-11). On a single-currency platform this is one entry.
  const donationByCurrency = panels.donations.reduce<Record<string, number>>((acc, d) => {
    acc[d.currency] = (acc[d.currency] || 0) + d.amount;
    return acc;
  }, {});
  const totalDonationStr =
    Object.entries(donationByCurrency)
      .map(([ccy, amt]) => money(amt, ccy))
      .join(" · ") || money(0);
  const platformDonationTotal = donationByCurrency[PLATFORM_CURRENCY] ?? 0;
  const sectionTitle: Record<string, string> = { overview: "Overview", inquiries: "Inquiries", chats: "Live chats", resources: "Resources", guidance: "Guidance library", feedback: "Feedback", donations: "Donations" };
  const cols = [
    { id: "pending", title: "Pending", tone: "attention", cards: panels.inquiriesByStatus.pending },
    { id: "responded", title: "Responded", tone: "sage", cards: panels.inquiriesByStatus.responded },
    { id: "closed", title: "Closed", tone: "", cards: panels.inquiriesByStatus.closed },
  ];
  // Sidebar search filters the active section's list (DEF-14). Empty query
  // matches everything, so these collapse to the full lists when not searching.
  const q = query.trim().toLowerCase();
  const matches = (...vals: (string | undefined | null)[]) =>
    !q || vals.some((v) => (v || "").toLowerCase().includes(q));
  const fCols = cols.map((c) => ({ ...c, cards: c.cards.filter((i) => matches(i.question, i.subject)) }));
  const fResources = panels.resources.filter((r) => matches(r.title, r.contentType, r.petTypeName));
  const fGuidance = panels.guidance.filter((g) => matches(g.title, g.emergencyType, ...g.petTypeNames));
  const fFeedback = panels.flaggedFeedback.filter((f) => matches(f.comment, f.targetType));
  const fChats = panels.activeChats.filter((c) => matches(c.subject));
  const fDonations = panels.donations.filter((d) => matches(d.reference, d.currency));
  const activity = (() => {
    const items: any[] = [];
    panels.inquiriesByStatus.pending.slice(0, 4).forEach((i) => items.push({ icon: "mail", tone: "coral", text: <>New inquiry: <strong>&quot;{i.question.slice(0, 50)}…&quot;</strong></>, time: i.createdAt }));
    panels.activeChats.forEach((c) => items.push({ icon: "chat", tone: c.status === "initiated" ? "coral" : "sage", text: c.status === "initiated" ? <>Pet owner waiting to <strong>start chat</strong></> : <>Active chat session · {c.messages.length} messages</>, time: c.startedAt }));
    panels.donations.slice(-3).forEach((d) => items.push({ icon: "gift", tone: "cream", text: <>Donation received: <strong>{money(d.amount, d.currency)}</strong></>, time: d.at || Date.now() }));
    panels.flaggedFeedback.forEach((f) => items.push({ icon: "star", tone: "coral", text: <>Feedback flagged for review · <strong>{f.rating}★</strong></>, time: f.createdAt }));
    return items.sort((a, b) => b.time - a.time).slice(0, 8);
  })();

  return (
    <>
      <div className="admin-shell">
        <div className={`nav-backdrop ${navOpen ? "open" : ""}`} onClick={() => setNavOpen(false)} aria-hidden="true" />
        <AdminSidebar active={active} setActive={setActive} panels={panels} account={account} onLogout={onLogout} open={navOpen} onClose={() => setNavOpen(false)} query={query} setQuery={setQuery} />
        <main className="admin-main">
          <div className="admin-topbar">
            <button className="nav-toggle" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Icon name="menu" size={18} /></button>
            <div className="crumbs"><span>Admin</span><span className="chev">›</span><strong>{sectionTitle[active]}</strong></div>
            <div className="grow" />
            <span className="live-pill">On duty</span>
            {active === "resources" && <button className="btn-ink" onClick={() => setShowNewResource(true)} style={{ padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 7, color: "white" }}><Icon name="plus" size={13} stroke={2} /> New resource</button>}
            <TopbarActions snapshot={snapshot} onAction={onAction} onSignOut={onLogout} />
          </div>

          <div className="admin-content">
            {active === "overview" && (
              <>
                <div className="admin-kpi-row">
                  <div className="admin-kpi featured">
                    <div className="kpi-label">Pending inquiries<div className="kpi-icon"><Icon name="mail" size={14} /></div></div>
                    <div className="kpi-value">{pendingCount}</div>
                    <div className="kpi-sub"><span className="kpi-delta">Avg 47s reply</span>Across {account.clinic || "all clinics"}</div>
                    <KpiSparkline color="rgba(255,255,255,0.45)" values={[2, 3, 2, 4, 3, 5, 4, 3, 5, 4]} />
                  </div>
                  <div className="admin-kpi">
                    <div className="kpi-label">Response SLA<div className="kpi-icon sage"><Icon name="check" size={14} /></div></div>
                    <div className="kpi-value">92<span className="unit">%</span></div>
                    <div className="kpi-sub"><span className="kpi-delta">+3 vs last week</span>Within 24 h target</div>
                    <KpiSparkline color="var(--success)" values={[88, 90, 89, 92, 90, 93, 91, 94, 92, 95]} />
                  </div>
                  <div className="admin-kpi">
                    <div className="kpi-label">Published content<div className="kpi-icon cream"><Icon name="book" size={14} /></div></div>
                    <div className="kpi-value">{publishedRes}<span className="unit">live</span></div>
                    <div className="kpi-sub"><span className="kpi-delta">+2 this month</span>{panels.resources.length - publishedRes} drafts</div>
                  </div>
                  <div className="admin-kpi">
                    <div className="kpi-label">Donations MTD<div className="kpi-icon"><Icon name="gift" size={14} /></div></div>
                    <div className="kpi-value">{platformDonationTotal.toFixed(0)}<span className="unit">{PLATFORM_CURRENCY}</span></div>
                    <div className="kpi-sub"><span className="kpi-delta">{panels.donations.length} contributions</span>Total verified</div>
                  </div>
                </div>

                <div className="admin-grid-2">
                  <div className="admin-panel">
                    <div className="admin-panel-head"><div><h2>Response SLA · 7 days</h2><div className="sub">% of inquiries answered within 24 hours</div></div><div className="admin-tabs"><button className="admin-tab">7D</button><button className="admin-tab active">30D</button><button className="admin-tab">90D</button></div></div>
                    <div className="admin-panel-body"><SlaChart /></div>
                  </div>
                  <div className="admin-panel">
                    <div className="admin-panel-head"><div><h2>Activity</h2><div className="sub">{activity.length} events</div></div></div>
                    <div className="admin-panel-body">
                      <div className="admin-activity">
                        {activity.length === 0 && <div className="admin-empty"><div className="icon-circle"><Icon name="bell" size={18} /></div><strong>No activity yet</strong><p>Inquiries and chats will appear here in real time.</p></div>}
                        {activity.map((a, i) => <div className="activity-item" key={i}><div className={`activity-icon ${a.tone}`}><Icon name={a.icon} size={14} /></div><div className="activity-body"><div className="activity-text">{a.text}</div><div className="activity-time">{relTime(a.time)}</div></div></div>)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-head"><div><h2>Inquiry pipeline</h2><div className="sub">Click any card to respond.</div></div><button className="btn-ghost" style={{ padding: "7px 12px", borderRadius: 9, background: "var(--gray)", fontSize: 12.5, fontWeight: 500 }} onClick={() => setActive("inquiries")}>View all →</button></div>
                  <div className="admin-panel-body" style={{ paddingTop: 12 }}>
                    <div className="admin-kanban">
                      {cols.map((col) => (
                        <div className="admin-col" key={col.id}>
                          <div className="admin-col-head"><span className={`admin-col-dot ${col.tone}`} /><h3>{col.title}</h3><span className={`pill ${col.tone}`}>{col.cards.length}</span></div>
                          {col.cards.length === 0 && <div style={{ background: "var(--white)", borderRadius: 12, padding: 22, textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>Nothing here</div>}
                          {col.cards.slice(0, 2).map((i) => <AdminInquiryCard key={i.id} inquiry={i} onOpen={setOpenInquiry} />)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {active === "inquiries" && (
              <div className="admin-panel">
                <div className="admin-panel-head">
                  <div><h2>All inquiries</h2><div className="sub">{pendingCount} pending · avg reply 47s</div></div>
                  <div className="admin-tabs">
                    {[{ id: "all", label: "All", count: fCols.reduce((s, c) => s + c.cards.length, 0) }, { id: "pending", label: "Pending", count: fCols[0].cards.length }, { id: "responded", label: "Responded", count: fCols[1].cards.length }, { id: "closed", label: "Closed", count: fCols[2].cards.length }].map((t) => (
                      <button key={t.id} className={`admin-tab ${inquiryFilter === t.id ? "active" : ""}`} onClick={() => setInquiryFilter(t.id)}>{t.label}<span className="tag">{t.count}</span></button>
                    ))}
                  </div>
                </div>
                <div className="admin-panel-body" style={{ paddingTop: 12 }}>
                  <div className="admin-kanban">
                    {fCols.filter((c) => inquiryFilter === "all" || inquiryFilter === c.id).map((col) => (
                      <div className="admin-col" key={col.id} style={inquiryFilter !== "all" ? { gridColumn: "1 / -1" } : {}}>
                        <div className="admin-col-head"><span className={`admin-col-dot ${col.tone}`} /><h3>{col.title}</h3><span className={`pill ${col.tone}`}>{col.cards.length}</span></div>
                        {col.cards.length === 0 && <div style={{ background: "var(--white)", borderRadius: 12, padding: 30, textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>Nothing here</div>}
                        {col.cards.map((i) => <AdminInquiryCard key={i.id} inquiry={i} onOpen={setOpenInquiry} />)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {active === "chats" && (
              <div className="admin-panel">
                <div className="admin-panel-head"><div><h2>Live chat sessions</h2><div className="sub">{panels.activeChats.length} open session(s)</div></div></div>
                <div className="admin-panel-body" style={{ paddingTop: 12 }}>
                  {fChats.length === 0 && <div className="admin-empty"><div className="icon-circle"><Icon name="chat" size={20} /></div><strong>{q ? "No matching chats" : "No active chats"}</strong><p>{q ? "Try a different search term." : "When a pet owner starts a chat, it'll appear here."}</p></div>}
                  {fChats.map((c) => (
                    <div className="donation-row" key={c.id} style={{ cursor: "pointer", gridTemplateColumns: "auto 1fr auto auto" }} {...clickable(() => setOpenChatId(c.id))}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent-deep)", display: "grid", placeItems: "center" }}><Icon name="chat" size={16} /></div>
                      <div className="donation-info"><strong>{c.subject || "Chat session"}</strong> · {c.messages.length} messages<div className="donation-meta">Started {relTime(c.startedAt)}</div></div>
                      <span className={`status-pill ${c.status === "active" ? "published" : "draft"}`}>{c.status}</span>
                      <button className="row-btn">Open →</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === "resources" && (
              <div className="admin-panel">
                <div className="admin-panel-head"><div><h2>Resource library</h2><div className="sub">{publishedRes} published · {panels.resources.length - publishedRes} drafts</div></div><button className="btn-ink" onClick={() => setShowNewResource(true)} style={{ padding: "8px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 7, color: "white" }}><Icon name="plus" size={13} stroke={2} /> New resource</button></div>
                <div className="admin-panel-body" style={{ padding: 0 }}>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>Title</th><th>Pet type</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        {fResources.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--ink-3)", fontSize: 12.5 }}>{q ? "No resources match your search." : "No resources yet."}</td></tr>}
                        {fResources.map((r) => (
                          <tr key={r.id}>
                            <td><div className="res-cell"><div className={`res-thumb ${r.contentType}`}><Icon name={r.contentType === "video" ? "book" : r.contentType === "images" ? "paw" : "book"} size={16} /></div><div><div className="res-title">{r.title}</div><div className="res-meta">{r.contentType.toUpperCase()} · #{r.id.slice(-5).toUpperCase()}</div></div></div></td>
                            <td><div className="pet-types">{r.petTypeName ? <span className="chip">{r.petTypeName}</span> : <span className="chip">All</span>}</div></td>
                            <td><span className={`status-pill ${r.status}`}>{r.status}</span></td>
                            <td><div className="row-actions">{r.status === "draft" ? <button className="row-btn" onClick={() => publishResource(r.id)}>Publish</button> : <button className="row-btn" disabled style={{ opacity: 0.5 }}>Published</button>}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {active === "guidance" && (
              <div className="admin-panel">
                <div className="admin-panel-head"><div><h2>First-aid guidance library</h2><div className="sub">{panels.guidance.length} guidance protocols authored</div></div></div>
                <div className="admin-panel-body">
                  <div className="guidance-grid">
                    {fGuidance.length === 0 && <div className="admin-empty"><div className="icon-circle"><Icon name="first_aid" size={18} /></div><strong>{q ? "No matching guidance" : "No guidance yet"}</strong><p>{q ? "Try a different search term." : "Authored protocols will appear here."}</p></div>}
                    {fGuidance.map((g) => (
                      <div className="guidance-card" key={g.id}>
                        <div className="guidance-card-head"><div className="guidance-card-icon"><Icon name={SCENARIO_ICONS[g.emergencyType] || "first_aid"} size={18} /></div><div><div className="guidance-card-title">{g.title}</div><div className="guidance-card-meta">{g.emergencyType}</div></div></div>
                        <div className="guidance-card-steps"><strong>{g.steps.length} steps</strong></div>
                        <div className="guidance-card-foot"><div className="chips">{g.petTypeNames.map((t) => <span className="chip" key={t}>{t}</span>)}</div><button className="row-btn" onClick={() => push("Guidance editor coming soon.")}><Icon name="edit" size={12} /></button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {active === "feedback" && (
              <div className="admin-panel">
                <div className="admin-panel-head"><div><h2>Flagged feedback</h2><div className="sub">Pet owners can flag content that needs attention</div></div></div>
                <div className="admin-panel-body">
                  {fFeedback.length === 0 && <div className="admin-empty"><div className="icon-circle"><Icon name="star" size={18} /></div><strong>{q ? "No matching feedback" : "Nothing flagged"}</strong><p>{q ? "Try a different search term." : "You're all caught up."}</p></div>}
                  <div className="feedback-grid">
                    {fFeedback.map((f) => (
                      <div className="feedback-card flagged" key={f.id}>
                        <div className="feedback-head"><span className="feedback-stars">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span><span className="status-pill" style={{ background: "var(--accent-soft)", color: "var(--accent-deep)" }}>Flagged</span></div>
                        <div className={`feedback-comment ${!f.comment ? "empty" : ""}`}>{f.comment || "No written comment"}</div>
                        <div className="feedback-foot"><span>{f.targetType} · #{f.targetId.slice(-5).toUpperCase()}</span><span style={{ marginLeft: "auto" }}>{relTime(f.createdAt)}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {active === "donations" && (
              <div className="admin-panel">
                <div className="admin-panel-head"><div><h2>Donations</h2><div className="sub">{panels.donations.length} verified · {totalDonationStr} total</div></div></div>
                <div className="admin-panel-body">
                  {fDonations.length === 0 && <div className="admin-empty"><div className="icon-circle"><Icon name="gift" size={18} /></div><strong>{q ? "No matching donations" : "No donations yet"}</strong><p>{q ? "Try a different search term." : "Contributions will appear here for verification."}</p></div>}
                  {fDonations.map((d) => (
                    <div className="donation-row" key={d.id}>
                      <div className="donation-amount"><span className="ccy">{d.currency}</span>{d.amount.toFixed(2)}</div>
                      <div className="donation-info"><strong>Contribution</strong><div className="donation-meta">Ref: {d.reference ? maskReference(d.reference) : "—"}{d.at ? ` · ${relTime(d.at)}` : ""}</div></div>
                      <span className="status-pill published">Verified</span>
                      <button className="row-btn" onClick={() => push("Receipt re-sent.", "success")}>Resend receipt</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ height: 24 }} />
          </div>
        </main>
      </div>

      {openInquiry && <RespondInquiryModal inquiry={openInquiry} onClose={() => setOpenInquiry(null)} onSubmit={respondInquiry} />}
      {showNewResource && <NewResourceModal petTypes={petTypes} onClose={() => setShowNewResource(false)} onSubmit={createAndMaybePublish} />}
      {openChat && <VetChatModal chat={openChat} myId={account.id} onClose={() => setOpenChatId(null)} onSend={handleSendChat} onCloseChat={handleCloseChat} />}
      {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
    </>
  );
}
