"use client";

/* Home — the public landing page (the first screen a logged-out visitor sees).
   Introduces PetAid and routes to sign-in / create-account or the guest
   first-aid library. The auth screen's "Back to home" button returns here. */
import Image from "next/image";
import { Icon } from "@/components/ui";

const FEATURES = [
  { icon: "first_aid", title: "Emergency first aid", desc: "Step-by-step, vet-reviewed protocols filtered to your pet — usable offline when seconds count." },
  { icon: "chat", title: "Talk to a real vet", desc: "Start a live chat with a veterinary expert for advice or support, with photos and read receipts." },
  { icon: "quiz", title: "Learn & stay ready", desc: "Quizzes, resources and a preparedness score help you build confidence before an emergency happens." },
];

export function Home({
  onSignIn,
  onRegister,
  onGuest,
}: {
  onSignIn: () => void;
  onRegister: () => void;
  onGuest: () => void;
}) {
  return (
    <div className="home">
      <header className="home-nav">
        <div className="home-brand">
          <div className="brand-mark"><Image src="/petaid-logo.png" alt="PetAid" width={36} height={36} /></div>
          <div>
            <div className="brand-name">PetAid</div>
            <div className="brand-role">Pet first-aid, done right</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" className="btn-ghost home-nav-link" onClick={onGuest}>Browse library</button>
        <button type="button" className="btn-secondary" onClick={onSignIn}>Sign in</button>
      </header>

      <section className="home-hero">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="home-hero-inner">
          <span className="home-eyebrow"><Icon name="shield" size={13} stroke={1.8} /> Trusted, vet-reviewed guidance</span>
          <h1>First-aid for the<br />pets you love.</h1>
          <p>
            Step-by-step emergency guidance, vet-reviewed resources, and a 24/7 channel to a real
            expert — all in one place.
          </p>
          <div className="home-cta-row">
            <button type="button" className="btn-primary" onClick={onRegister}>Get started — it&apos;s free</button>
            <button type="button" className="btn-secondary" onClick={onGuest}>
              Browse as guest <span style={{ color: "var(--ink-3)" }}>→</span>
            </button>
          </div>
          <div className="home-signin-hint">
            Already have an account?{" "}
            <button type="button" className="btn-link" onClick={onSignIn}>Sign in</button>
          </div>
        </div>
      </section>

      <section className="home-features">
        {FEATURES.map((f) => (
          <div className="home-feature" key={f.title}>
            <div className="home-feature-icon"><Icon name={f.icon} size={20} /></div>
            <div className="home-feature-title">{f.title}</div>
            <p className="home-feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="home-foot">
        PetAid supports — it never replaces — professional veterinary care. In a real emergency,
        contact your nearest emergency clinic first.
      </footer>
    </div>
  );
}
