"use client";

/* Pet Owner dashboard — 1:1 port of views/20-pet-owner.jsx, wired to the API.
   Covers SRS §7.1/7.2/7.4/7.5/7.6/7.7. */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ApiError, petaid, usePetAid, can, Permission, money, PLATFORM_CURRENCY, type Guidance, type PetOwnerPanels, type Quiz, type Resource, type Snapshot } from "@/lib/petaid";
import { BusyButton, ConfirmDialog, Field, Icon, ImageGallery, Modal, StarRow, clickable, relTime, maskReference, useToast, fileToDownscaledDataUrl } from "@/components/ui";
import { useChatRealtime } from "@/lib/chatRealtime";
import { ChatThread } from "./ChatThread";
import { FaqPanel } from "./Faq";
import { TopbarActions } from "./Popovers";
import { Settings } from "./Settings";
import { HelpCenter } from "./Help";

const SCENARIO_ICONS: Record<string, string> = {
  cardiac: "heart", poisoning: "alert", bleeding: "droplet", heatstroke: "thermometer", choking: "bone",
};
const RES_ICON = (t: string) => (t === "video" ? "book" : t === "images" || t === "image" ? "paw" : "book");

/* ---------- Sidebar ---------- */
function POSidebar({ active, setActive, panels, account, onLogout, open, onClose, onOpenPet, chatUnread = 0 }: any) {
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
          { id: "chats", label: "Vet Chat", icon: "chat", unread: chatUnread },
          { id: "donations", label: "Donations", icon: "gift" },
        ].map((it: any) => (
          <button key={it.id} className={`nav-item ${active === it.id ? "active" : ""} ${it.unread > 0 ? "has-attention" : ""}`} onClick={() => go(it.id)}>
            <Icon name={it.icon} size={16} />
            <span>{it.label}</span>
            {it.unread > 0 ? <span className="nav-unread">{it.unread}</span> : it.count != null && it.count > 0 && <span className="nav-count">{it.count}</span>}
          </button>
        ))}
      </nav>
      <div>
        <div className="section-label">My Pets</div>
        <div className="nav">
          {panels.pets.map((p: any) => (
            <div className="member" key={p.id} {...clickable(() => { onOpenPet?.(p); onClose?.(); })} title={`View ${p.name}'s profile`}>
              <PetAvatar pet={p} className="member-avatar" />
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
/** Pet avatar — uploaded photo if present, otherwise the pet-type emoji. */
function PetAvatar({ pet, className = "pet-avatar-lg" }: { pet: any; className?: string }) {
  if (pet.image) {
    return (
      <div className={className} style={{ overflow: "hidden", padding: 0 }}>
        <img src={pet.image} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return <div className={className}>{pet.emoji}</div>;
}

/** Prepared pet icons the owner can pick from. */
const PET_ICONS = ["🐕", "🐈", "🐇", "🐹", "🐦", "🐠", "🐢", "🐴", "🐷", "🐤", "🦜", "🐾"];

/** Avatar picker — choose a prepared icon OR upload a photo (which wins). */
function PetAvatarPicker({ icon, image, onChange }: { icon: string | null; image: string | null; onChange: (v: { icon?: string | null; image?: string | null }) => void }) {
  const [reading, setReading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setReading(true);
    try { onChange({ image: await fileToDownscaledDataUrl(files[0], 640, 0.8) }); }
    catch { /* ignore unreadable files */ }
    finally { setReading(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", background: "var(--cream)", display: "grid", placeItems: "center", border: "1px solid var(--line)", fontSize: 30, flexShrink: 0 }}>
          {image ? <img src={image} alt="Pet" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (icon || "🐾")}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pick(e.target.files)} />
          <button type="button" className="btn-secondary" onClick={() => ref.current?.click()} disabled={reading}>{reading ? "Reading…" : image ? "Change photo" : "Upload photo"}</button>
          {image && <button type="button" className="btn-ghost" onClick={() => onChange({ image: null })}>Use an icon</button>}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>Or pick an icon</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {PET_ICONS.map((e) => {
          const selected = !image && icon === e;
          return (
            <button key={e} type="button" onClick={() => onChange({ icon: e, image: null })} aria-label={`Use ${e} icon`} aria-pressed={selected}
              style={{ width: 42, height: 42, borderRadius: 10, fontSize: 22, lineHeight: 1, display: "grid", placeItems: "center", cursor: "pointer", border: `1.5px solid ${selected ? "var(--accent)" : "var(--line-2)"}`, background: selected ? "var(--accent-soft)" : "var(--white)" }}>
              {e}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PetsRow({ pets, onAdd, onOpen }: any) {
  return (
    <div className="pets-row">
      {pets.map((p: any) => (
        <div className="pet-card" key={p.id} {...clickable(() => onOpen?.(p))} title={`View ${p.name}'s profile`}>
          <PetAvatar pet={p} />
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
  const [image, setImage] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = async () => {
    setErrors({});
    try {
      await onSubmit({ name, typeId, breed, age: Number(age), image_url: image, icon_emoji: icon });
    } catch (e) {
      if (e instanceof ApiError && e.field) setErrors({ [e.field]: e.message });
      else setErrors({ form: e instanceof Error ? e.message : "Failed" });
    }
  };
  return (
    <Modal title="Add a pet" subtitle="Pet Type drives which guidance and quizzes you see." onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Adding…">Add pet</BusyButton></>}>
      <Field label="Profile picture">
        <PetAvatarPicker icon={icon} image={image} onChange={(v) => { if ("image" in v) setImage(v.image ?? null); if ("icon" in v) setIcon(v.icon ?? null); }} />
      </Field>
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

function PetProfileModal({ pet, petTypes, onClose, onSave, onDelete }: any) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pet.name);
  const [typeId, setTypeId] = useState(pet.typeId || petTypes[0]?.id || "");
  const [breed, setBreed] = useState(pet.breed || "");
  const [age, setAge] = useState(String(pet.age ?? 0));
  const [notes, setNotes] = useState(pet.notes || "");
  const [image, setImage] = useState<string | null>(pet.image || null);
  const [icon, setIcon] = useState<string | null>(pet.icon || null);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }
    try {
      await onSave({ name: name.trim(), pet_type_id: typeId, breed: breed.trim(), age_years: Number(age) || 0, health_notes: notes, image_url: image, icon_emoji: icon });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Couldn't save.");
    }
  };
  const remove = async () => {
    if (!window.confirm(`Remove ${pet.name}? This permanently deletes the pet and its profile.`)) return;
    setError(null);
    try { await onDelete(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't remove."); }
  };
  const Row = ({ label, value }: { label: string; value: any }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
  return (
    <Modal
      title={editing ? `Edit ${pet.name}` : pet.name}
      subtitle={editing ? "Update your pet's details." : `${pet.typeName || "Pet"} profile`}
      onClose={onClose}
      footer={
        editing ? (
          <>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <BusyButton className="btn-primary" onClick={save} busyLabel="Saving…">Save changes</BusyButton>
          </>
        ) : (
          <>
            <BusyButton className="btn-secondary" onClick={remove} busyLabel="Removing…" style={{ color: "var(--danger)" }}>Remove pet</BusyButton>
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit</button>
          </>
        )
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <PetAvatar pet={pet} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{pet.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{pet.typeName || "Pet"}</div>
        </div>
      </div>
      {!editing ? (
        <div>
          <Row label="Type" value={pet.typeName} />
          <Row label="Breed" value={pet.breed} />
          <Row label="Age" value={`${pet.age ?? 0} yr`} />
          <div style={{ padding: "12px 0 0" }}>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 6 }}>Health notes</div>
            <div style={{ padding: 12, background: "var(--gray)", borderRadius: 10, fontSize: 13.5, lineHeight: 1.5, minHeight: 44 }}>{pet.notes || "No notes yet — tap Edit to add health notes."}</div>
          </div>
        </div>
      ) : (
        <>
          <Field label="Profile picture"><PetAvatarPicker icon={icon} image={image} onChange={(v) => { if ("image" in v) setImage(v.image ?? null); if ("icon" in v) setIcon(v.icon ?? null); }} /></Field>
          <Field label="Pet name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
          <Field label="Pet type">
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {petTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Age (years)"><input value={age} onChange={(e) => setAge(e.target.value)} type="number" min="0" max="30" /></Field>
          <Field label="Breed"><input value={breed} onChange={(e) => setBreed(e.target.value)} maxLength={60} placeholder="e.g. Golden Retriever" /></Field>
          <Field label="Health notes" hint="Allergies, conditions, medications…">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={1000} placeholder="Any health details the vet should know…" style={{ padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, resize: "vertical" }} />
          </Field>
        </>
      )}
      {error && <div className="banner error" style={{ marginTop: 12 }}>{error}</div>}
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
  const [images, setImages] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX = 4;
  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    setReading(true);
    try {
      const incoming: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        incoming.push(await fileToDownscaledDataUrl(f));
      }
      setImages((prev) => [...prev, ...incoming].slice(0, MAX));
    } catch {
      setError("Couldn't process that image. Try another file.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const submit = async () => {
    setError(null);
    if (!question.trim()) { setError("Please describe your pet's condition."); return; }
    try { await onSubmit(question, images); } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };
  return (
    <Modal title="Submit an inquiry" subtitle="A veterinary expert will respond within the dashboard." onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Submitting…">Submit</BusyButton></>}>
      <Field label="Your question" error={error} hint="Up to 1000 characters.">
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Describe the situation, your pet's symptoms, and any timing details…" rows={6} maxLength={1000} style={{ padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, resize: "vertical" }} />
      </Field>
      <Field label="Photos (optional)" hint={`Add up to ${MAX} photos of your pet's condition.`}>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: "relative", width: 64, height: 64, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }}>
              <img src={src} alt={`Attachment ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button type="button" aria-label="Remove photo" onClick={() => setImages(images.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 12, lineHeight: 1, display: "grid", placeItems: "center" }}>×</button>
            </div>
          ))}
          {images.length < MAX && (
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={reading} aria-label="Add photo"
              style={{ width: 64, height: 64, padding: 0, display: "grid", placeItems: "center" }}>
              {reading ? "…" : <Icon name="upload" size={18} />}
            </button>
          )}
        </div>
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
      <ImageGallery images={inquiry.images} label="Your photos" />
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

function StartChatModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (subject: string, vetId: string | null) => Promise<void> }) {
  const [topic, setTopic] = useState<"advice" | "support">("advice");
  const [vetId, setVetId] = useState("");
  const [note, setNote] = useState("");
  const [vets, setVets] = useState<{ id: string; full_name: string; initials: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { petaid.listVets().then(setVets).catch(() => {}); }, []);

  const TOPICS = [
    { id: "advice" as const, label: "Pet first-aid advice", desc: "Medical guidance from a veterinary expert.", icon: "first_aid" },
    { id: "support" as const, label: "Customer support", desc: "Account help and general questions.", icon: "inquiry" },
  ];
  const submit = async () => {
    setError(null);
    const topicLabel = topic === "advice" ? "Pet first-aid advice" : "Customer support";
    const subject = (note.trim() ? `${topicLabel}: ${note.trim()}` : topicLabel).slice(0, 160);
    try { await onSubmit(subject, vetId || null); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't start the chat. Please try again."); }
  };
  return (
    <Modal title="Start a chat" subtitle="Choose a topic and who you'd like to reach." onClose={onClose}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><BusyButton className="btn-primary" onClick={submit} busyLabel="Starting…">Start chat</BusyButton></>}>
      <Field label="What's this about?">
        <div className="topic-grid">
          {TOPICS.map((t) => (
            <button key={t.id} type="button" className={`topic-card ${topic === t.id ? "on" : ""}`} onClick={() => setTopic(t.id)} aria-pressed={topic === t.id}>
              <div className="topic-icon"><Icon name={t.icon} size={18} /></div>
              <div><div className="topic-label">{t.label}</div><div className="topic-desc">{t.desc}</div></div>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Who would you like to chat with?" hint="Pick a specific expert, or let any available expert respond.">
        <select value={vetId} onChange={(e) => setVetId(e.target.value)}>
          <option value="">Any available expert</option>
          {vets.map((v) => <option key={v.id} value={v.id}>Dr. {v.full_name}</option>)}
        </select>
      </Field>
      <Field label="Add a note (optional)" hint="A short summary helps them help you faster.">
        <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 140))} rows={3} placeholder="e.g. My dog has been limping since this morning…" style={{ padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, resize: "vertical" }} />
      </Field>
      {error && <div className="banner error">{error}</div>}
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
  const { chats, refreshChats, presenceFor } = useChatRealtime();
  const panels = snapshot.dashboard!.panels as PetOwnerPanels;
  const header = snapshot.dashboard!.header;
  const account = snapshot.account!;
  const chatUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  const [active, setActive] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [openPet, setOpenPet] = useState<any>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [openInquiry, setOpenInquiry] = useState<any>(null);
  const [openQuiz, setOpenQuiz] = useState<Quiz | null>(null);
  const [showDonation, setShowDonation] = useState(false);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [showStartChat, setShowStartChat] = useState(false);
  const [chatTab, setChatTab] = useState<"chats" | "faq">("chats");
  const [feedbackTarget, setFeedbackTarget] = useState<Resource | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState("profile");
  const [showHelp, setShowHelp] = useState(false);

  // Live chat list comes from the realtime provider (WebSocket-backed), so the
  // vet's replies, read receipts, typing and presence arrive without polling.
  const openChat = openChatId ? chats.find((c) => c.id === openChatId) || null : null;

  /* handlers */
  const handleAddPet = async (d: any) => {
    await petaid.addPet({ name: d.name, pet_type_id: d.typeId, breed: d.breed, age_years: d.age, health_notes: "", image_url: d.image_url, icon_emoji: d.icon_emoji });
    await refresh();
    setShowAddPet(false);
    push("Pet added.", "success");
  };
  const handleUpdatePet = async (data: any) => {
    await petaid.updatePet(openPet.id, data);
    await refresh();
    setOpenPet(null);
    push("Pet profile updated.", "success");
  };
  const handleDeletePet = async () => {
    await petaid.deletePet(openPet.id);
    await refresh();
    setOpenPet(null);
    push("Pet removed.", "success");
  };
  const handleNewInquiry = async (q: string, images: string[] = []) => {
    await petaid.submitInquiry(q.slice(0, 120) || "Inquiry", q, images);
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
  const submitStartChat = async (subject: string, vetId: string | null) => {
    const c = await petaid.startChat(subject, vetId);
    await refreshChats();
    setShowStartChat(false);
    setActive("chats");
    setOpenChatId(c.id);
  };
  const handleCloseChat = async () => {
    if (!openChatId) return;
    try {
      await petaid.closeChat(openChatId);
      await refreshChats();
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
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const onLogout = () => setConfirmSignOut(true); // open the styled confirmation

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
        <POSidebar active={active} setActive={setActive} panels={panels} account={account} onLogout={onLogout} open={navOpen} onClose={() => setNavOpen(false)} onOpenPet={setOpenPet} chatUnread={chatUnread} />
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
              <div className="section-title"><h2>Your pets</h2>{can(snapshot, Permission.PET_MANAGE) && <button className="btn-ghost" onClick={() => setShowAddPet(true)}><Icon name="plus" size={12} stroke={2} /> Add pet</button>}</div>
              <PetsRow pets={panels.pets} onAdd={() => setShowAddPet(true)} onOpen={setOpenPet} />
              <div className="section-title"><h2>Quick actions</h2></div>
              <div style={{ padding: "0 28px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { id: "quiz", icon: "quiz", label: "Take a quiz", sub: `${panels.quizzes.length} available`, perm: Permission.QUIZ_TAKE, onClick: () => setActive("quizzes") },
                  { id: "inquiry", icon: "mail", label: "Ask a vet", sub: "Asynchronous reply", perm: Permission.INQUIRY_CREATE, onClick: () => setShowInquiry(true) },
                  { id: "chat", icon: "chat", label: "Start chat", sub: "Live with a vet", perm: Permission.CHAT_INITIATE, onClick: () => setShowStartChat(true) },
                  { id: "donate", icon: "gift", label: "Donate", sub: "Support the cause", perm: Permission.DONATION_CREATE, onClick: () => setShowDonation(true) },
                ].filter((a) => can(snapshot, a.perm)).map((a) => (
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
              <div className="section-title"><h2>My pets</h2>{can(snapshot, Permission.PET_MANAGE) && <button className="btn-ink" onClick={() => setShowAddPet(true)}><Icon name="plus" size={13} stroke={2} /> Add pet</button>}</div>
              <PetsRow pets={panels.pets} onAdd={() => setShowAddPet(true)} onOpen={setOpenPet} />
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
                    {can(snapshot, Permission.FEEDBACK_SUBMIT) && <button className="btn-ghost" onClick={() => setFeedbackTarget(r)}><Icon name="star" size={13} /> Rate</button>}
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
              <div className="section-title">
                <h2>Vet chat</h2>
                {chatTab === "chats" && <button className="btn-ink" onClick={() => setShowStartChat(true)}><Icon name="plus" size={13} stroke={2} /> Start new chat</button>}
              </div>
              <div className="chat-tabs" role="tablist" aria-label="Vet chat sections">
                <button role="tab" aria-selected={chatTab === "chats"} className={`chat-tab ${chatTab === "chats" ? "on" : ""}`} onClick={() => setChatTab("chats")}>
                  <Icon name="chat" size={14} /> Chats{chatUnread > 0 && <span className="chat-tab-badge">{chatUnread}</span>}
                </button>
                <button role="tab" aria-selected={chatTab === "faq"} className={`chat-tab ${chatTab === "faq" ? "on" : ""}`} onClick={() => setChatTab("faq")}>
                  <Icon name="book" size={14} /> Help &amp; FAQ
                </button>
              </div>

              {chatTab === "chats" ? (
                <div style={{ padding: "0 28px" }}>
                  {chats.length === 0 && <div className="empty-state"><strong>No chats yet.</strong>Tap &quot;Start new chat&quot; to talk with a vet, or browse Help &amp; FAQ.</div>}
                  {chats.map((c) => {
                    const pres = presenceFor(c.vetId);
                    const preview = c.lastMessage ? `${c.lastMessage.senderId === account.id ? "You: " : ""}${c.lastMessage.preview}` : "No messages yet";
                    return (
                      <div className={`list-item chat-li ${c.unread > 0 ? "unread" : ""}`} key={c.id} {...clickable(() => setOpenChatId(c.id))}>
                        <div className="li-icon" style={{ position: "relative" }}>
                          <Icon name="chat" size={16} />
                          {c.status !== "closed" && <span className={`chat-pdot ${pres.online ? "on" : ""}`} />}
                        </div>
                        <div className="li-body">
                          <div className="li-title">{c.subject || "Vet chat"}</div>
                          <div className="li-meta chat-preview">{preview}</div>
                        </div>
                        <div className="chat-li-aside">
                          <span className="chat-li-time">{relTime(c.lastMessage?.at || c.startedAt)}</span>
                          {c.unread > 0 ? <span className="chat-unread">{c.unread}</span> : <StatusPill status={c.status} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "0 28px" }}>
                  <FaqPanel onStartChat={() => { setChatTab("chats"); setShowStartChat(true); }} />
                </div>
              )}
            </>
          )}

          {active === "donations" && (
            <>
              <div className="section-title"><h2>Donations</h2>{can(snapshot, Permission.DONATION_CREATE) && <button className="btn-ink" onClick={() => setShowDonation(true)}><Icon name="plus" size={13} stroke={2} /> Donate</button>}</div>
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
      {openPet && <PetProfileModal pet={openPet} petTypes={panels.petTypes} onClose={() => setOpenPet(null)} onSave={handleUpdatePet} onDelete={handleDeletePet} />}
      {showInquiry && <NewInquiryModal onClose={() => setShowInquiry(false)} onSubmit={handleNewInquiry} />}
      {openInquiry && <InquiryDetailModal inquiry={openInquiry} onClose={() => setOpenInquiry(null)} />}
      {openQuiz && <QuizModal quiz={openQuiz} onClose={() => setOpenQuiz(null)} onSubmit={handleQuizSubmit} />}
      {showDonation && <DonationModal donations={panels.donations} onClose={() => setShowDonation(false)} onSubmit={handleDonate} />}
      {showStartChat && <StartChatModal onClose={() => setShowStartChat(false)} onSubmit={submitStartChat} />}
      {openChat && (
        <ChatThread
          key={openChat.id}
          chat={openChat}
          myId={account.id}
          title="Chat with the vet team"
          peerName="Vet team"
          onClose={() => setOpenChatId(null)}
          onCloseChat={handleCloseChat}
        />
      )}
      {feedbackTarget && <FeedbackModal target={feedbackTarget} onClose={() => setFeedbackTarget(null)} onSubmit={handleFeedback} />}
      {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
      {confirmSignOut && (
        <ConfirmDialog
          title="Sign out?"
          message="You'll need to sign in again to get back to your pets and vet chats."
          confirmLabel="Sign out"
          onConfirm={() => { setConfirmSignOut(false); void petaid.logout(); }}
          onClose={() => setConfirmSignOut(false)}
        />
      )}
    </>
  );
}
