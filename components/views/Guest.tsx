"use client";

/* Guest mode — public read-only first-aid library. 1:1 port of views/17-guest.jsx. */
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { petaid, type Guidance, type PetType } from "@/lib/petaid";

const SCENARIO_ICONS: Record<string, string> = {
  cardiac: "heart",
  poisoning: "alert",
  bleeding: "droplet",
  heatstroke: "thermometer",
  choking: "bone",
};

export function Guest({ onSignIn }: { onSignIn: () => void }) {
  const [guidance, setGuidance] = useState<Guidance[]>([]);
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [open, setOpen] = useState<Guidance | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    petaid.guestData().then((d) => {
      setGuidance(d.guidance);
      setPetTypes(d.petTypes);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      guidance.filter((g) => {
        const matchesType = filterType === "all" || g.petTypeIds.includes(filterType);
        const q = query.trim().toLowerCase();
        const matchesQuery = !q || g.title.toLowerCase().includes(q) || g.emergencyType.toLowerCase().includes(q);
        return matchesType && matchesQuery;
      }),
    [guidance, filterType, query],
  );

  return (
    <div className="guest-shell">
      <header className="guest-header">
        <div className="guest-brand">
          <div className="brand-mark">
            <Image src="/petaid-logo.png" alt="PetAid" width={40} height={40} />
          </div>
          <div>
            <div className="brand-name">PetAid</div>
            <div className="brand-role">Public first-aid library</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <span className="guest-badge">
          <Icon name="shield" size={12} stroke={1.8} />
          Guest mode · no account
        </span>
        <button className="btn-primary guest-cta" onClick={onSignIn}>
          Sign in for full access
        </button>
      </header>

      <section className="guest-hero">
        <div className="guest-hero-text">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-deep)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
            ● Public access · works offline
          </span>
          <h1>First-aid guidance for the pets you love.</h1>
          <p>Step-by-step emergency protocols, reviewed by veterinary experts. Free to browse for everyone — no sign-in required.</p>

          <div className="guest-search-row">
            <div className="guest-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scenarios — bleeding, choking, CPR…" />
            </div>
          </div>

          <div className="guest-filters">
            <button className={filterType === "all" ? "on" : ""} onClick={() => setFilterType("all")}>All pets</button>
            {petTypes.map((t) => (
              <button key={t.id} className={filterType === t.id ? "on" : ""} onClick={() => setFilterType(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="guest-emergency-card">
          <div className="emergency-pulse">
            <Icon name="alert" size={22} stroke={2} />
          </div>
          <strong>In a real emergency?</strong>
          <p>Call your nearest emergency veterinary clinic <strong>first</strong>. PetAid guidance supports — never replaces — professional veterinary care.</p>
        </div>
      </section>

      <section className="guest-grid-wrap">
        <div className="guest-grid">
          {filtered.map((g) => (
            <button key={g.id} className="guest-card" onClick={() => { setOpen(g); setDoneSteps(new Set()); }}>
              <div className="guest-card-icon">
                <Icon name={SCENARIO_ICONS[g.emergencyType] || "first_aid"} size={20} />
              </div>
              <div className="guest-card-body">
                <div className="guest-card-title">{g.title}</div>
                <div className="guest-card-meta">
                  {g.steps.length} steps · {g.emergencyType} · {g.petTypeNames.join(", ") || "all pets"}
                </div>
              </div>
              <Icon name="chevron" size={14} stroke={1.5} />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <strong>No matching scenarios.</strong>Try a different search term or pet type.
            </div>
          )}
        </div>

        <div className="guest-locked-grid">
          {[
            { icon: "chat", label: "Live vet chat", desc: "Real-time conversation with a registered vet." },
            { icon: "mail", label: "Submit inquiry", desc: "Get a vet to answer your specific question." },
            { icon: "quiz", label: "Take quizzes", desc: "Test your knowledge and track your readiness." },
            { icon: "paw", label: "Your pets", desc: "Save pet profiles so content is auto-filtered." },
          ].map((it) => (
            <div className="guest-locked-card" key={it.label}>
              <div className="guest-locked-icon">
                <Icon name={it.icon} size={16} />
              </div>
              <div className="guest-locked-body">
                <div className="guest-locked-title">{it.label}</div>
                <div className="guest-locked-desc">{it.desc}</div>
              </div>
              <span className="guest-lock-pill">
                <Icon name="shield" size={11} stroke={1.7} /> Sign in
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer className="guest-foot">
        <div>
          <strong>Want the full PetAid experience?</strong>
          <p>Create a free account to chat with vets, submit inquiries, and save your pets&apos; profiles for filtered guidance.</p>
        </div>
        <button className="btn-primary guest-cta" onClick={onSignIn}>Create an account</button>
      </footer>

      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(null)} />
          <aside className="drawer">
            <div className="drawer-head">
              <div>
                <div className="live">Step-by-step guidance</div>
                <h2>{open.title}</h2>
              </div>
              <button className="modal-close" onClick={() => setOpen(null)}>
                <Icon name="x" size={14} stroke={2} />
              </button>
            </div>
            <div className="drawer-body">
              <ol className="steps-list">
                {open.steps.map((step, i) => (
                  <li
                    key={i}
                    className={doneSteps.has(i) ? "done" : ""}
                    onClick={() => {
                      const next = new Set(doneSteps);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      setDoneSteps(next);
                    }}
                  >
                    {step}
                  </li>
                ))}
              </ol>
              <div style={{ marginTop: 12, padding: 14, background: "var(--cream)", borderRadius: 12, fontSize: 13 }}>
                <strong>This is general first-aid guidance.</strong>
                <p style={{ margin: "6px 0 10px", color: "var(--ink-2)" }}>
                  For your pet&apos;s specific situation, a live vet can help. Create an account to chat in real time.
                </p>
                <button className="btn-primary" style={{ width: "auto", padding: "8px 14px" }} onClick={onSignIn}>
                  Sign in or create account →
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
