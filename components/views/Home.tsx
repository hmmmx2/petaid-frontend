"use client";

/* Home — the public marketing landing page (first screen a logged-out visitor
   sees). 1:1 port of petaid/index.html into React, wired to the app's
   Sign in / Get started / Browse-as-guest actions. All CSS is namespaced .lp-*
   (see app/petaid.css) so it never collides with the in-app dashboards. */
import Image from "next/image";
import { useEffect, useState } from "react";

const FEATURES = [
  { tone: "", title: "Emergency first-aid", body: "Step-by-step protocols for CPR, choking, bleeding, poisoning and more. Filtered to your pet type. Works offline.", link: "Learn more →", to: "#how",
    icon: <><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></> },
  { tone: "sage", title: "Live vet chat", body: "Real-time conversation with a registered veterinary expert in under a minute. Average reply: 47 seconds.", link: "Meet the vets →", to: "#vets",
    icon: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" /> },
  { tone: "cream", title: "Vet-reviewed quizzes", body: "Test your readiness on common emergencies. Track your preparedness score and get better, one topic at a time.", link: "Try a quiz →", action: "register",
    icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 4 2L12 13v1" /><circle cx="12" cy="17" r="0.5" fill="currentColor" /></> },
  { tone: "ink", title: "Pet profiles", body: "Add your dogs, cats, rabbits and more. Content adapts to your pet's species, age and special notes.", link: "Add a pet →", action: "register",
    icon: <><circle cx="6" cy="10" r="2" /><circle cx="18" cy="10" r="2" /><circle cx="9" cy="5" r="1.8" /><circle cx="15" cy="5" r="1.8" /><path d="M8 17a4 4 0 1 1 8 0c0 2-1 4-4 4s-4-2-4-4Z" /></> },
];

const STEPS = [
  { n: "01", title: "Add your pet", body: "Tell us about your dog, cat or rabbit — name, age, breed, special notes. Takes 30 seconds." },
  { n: "02", title: "Stay prepared", body: "Browse protocols, take 5-minute quizzes, save key clinics. Your preparedness score updates as you learn." },
  { n: "03", title: "Act, with confidence", body: "When something happens, tap the Emergency button. Chat with a vet live or follow vetted step-by-step guidance." },
];

const VET_POINTS = [
  { title: "Triage inquiry kanban", sub: "Pending, responded, closed — keep your queue clean." },
  { title: "Content authoring with media", sub: "Upload videos, attach to pet types, publish or save as draft." },
  { title: "MFA-protected access", sub: "All vet accounts require two-factor authentication by default." },
  { title: "Feedback signal", sub: "Flagged content surfaces automatically — improve the library continuously." },
];

const VET_QUEUE = [
  { initials: "AT", bg: "var(--accent)", name: "Mochi's paw pad — bleeding?", meta: "Alwin · Golden Retriever, 3 yr", dot: true, time: "12s" },
  { initials: "SL", bg: "var(--ink-2)", name: "Cat won't eat — should I worry?", meta: "Sarah · Tabby, 2 yr", dot: false, time: "2m" },
  { initials: "RB", bg: "var(--success)", name: "Rabbit limping after fall", meta: "Renu · Holland Lop, 1 yr", dot: false, time: "4m" },
];

const STATS = [
  { num: <><em>200K</em>+</>, label: "Pets in registered families" },
  { num: <em>1.2M</em>, label: "Scenarios accessed" },
  { num: <><em>47</em>s</>, label: "Average vet response time" },
  { num: <em>96%</em>, label: "Of users feel more prepared" },
];

const TESTIMONIALS = [
  { emoji: "🐕", body: "\"My dog ate chocolate at 2 a.m. and I panicked. PetAid walked me through it in under two minutes and connected me to a vet on call. I credit them for staying calm.\"", name: "Mei Tan", role: "Pet owner · Kuala Lumpur" },
  { emoji: "🐈", body: "\"The quizzes are genuinely useful — I aced the CPR module and three weeks later actually had to use it. The muscle memory was there.\"", name: "Daniel Liew", role: "Cat parent · Penang" },
  { initials: "KS", body: "\"As a vet, the dashboard saves me hours. Inquiries route to me automatically, content publishing is one click, and the chat keeps my workflow predictable.\"", name: "Dr. Kavitha S.", role: "Veterinary Expert · Greenpaws" },
];

const FAQS = [
  { q: "Is PetAid free to use?", a: "Yes — browsing the first-aid library, taking quizzes, and creating an account are all completely free. Live vet chat sessions and inquiries are also free up to a generous monthly limit. Donations support the Veterinary Association and keep the platform free for everyone." },
  { q: "Is this a replacement for a real vet?", a: "No. PetAid provides first-aid guidance for the critical time between an incident and reaching professional care. Always contact a veterinarian for medical emergencies — and PetAid will help you do exactly that, faster." },
  { q: "What pets does PetAid support?", a: "Dogs, cats, rabbits, hamsters and guinea pigs at launch. Birds, reptiles and aquatic pets are on our roadmap for the next year, in partnership with specialist vets." },
  { q: "Does it work without an internet connection?", a: "Yes — the first-aid library is cached for offline access. Once you've opened PetAid online at least once, every guidance scenario remains available even without signal. Live chat and inquiries require connectivity." },
  { q: "How do I become a verified Veterinary Expert?", a: "Apply through the partner portal with your veterinary license number and professional references. Our team verifies credentials with the local Veterinary Association within 2–3 business days, then we onboard you with MFA setup and a brief platform walkthrough." },
  { q: "How is my data protected?", a: "PetAid follows the Malaysian PDPA 2010 and equivalent international standards. All traffic is HTTPS, passwords are hashed, and your data is never sold. You can download or delete everything we hold from your settings at any time." },
];

const check = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>;

export function Home({
  onSignIn,
  onRegister,
  onGuest,
}: {
  onSignIn: () => void;
  onRegister: () => void;
  onGuest: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Subtle staggered reveal — start visible, then animate (so content still
  // shows if the observer never fires).
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".lp-reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = `opacity .6s ease ${i * 0.06}s, transform .6s ease ${i * 0.06}s`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp">
      {/* ---- NAV ---- */}
      <header className={`lp-nav-bar ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-nav">
          <a className="lp-brand" href="#top">
            <span className="lp-brand-mark"><Image src="/petaid-logo.png" alt="PetAid logo" width={36} height={36} /></span>
            <span className="lp-brand-name">PetAid</span>
          </a>
          <nav className="lp-nav-links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#vets">For vets</a>
            <a href="#stats">Impact</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="lp-nav-cta">
            <button type="button" className="lp-btn lp-btn-ghost" onClick={onSignIn}>Sign in</button>
            <button type="button" className="lp-btn lp-btn-primary" onClick={onRegister}>Get started →</button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ---- HERO ---- */}
        <section className="lp-hero">
          <div className="lp-wrap">
            <div className="lp-hero-grid">
              <div>
                <span className="lp-hero-eyebrow"><span className="lp-pill">New</span> Trusted by 200,000+ pet families</span>
                <h1>First-aid <em>for the pets</em> you love.</h1>
                <p className="lp-hero-sub">Step-by-step emergency guidance, live veterinary chat, and vet-reviewed resources. Always with you. Always free to browse — even offline.</p>
                <div className="lp-hero-ctas">
                  <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onRegister}>Get started — free</button>
                  <button type="button" className="lp-btn lp-btn-ghost lp-btn-lg" onClick={onGuest}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
                    Try as guest →
                  </button>
                </div>
                <div className="lp-hero-trust">
                  <div className="lp-avatars"><span>🐕</span><span>🐈</span><span>🐇</span><span>🐦</span></div>
                  <div>
                    <span className="lp-stars" aria-label="4.9 out of 5 stars">★★★★★</span>{" "}
                    <strong style={{ fontWeight: 600, color: "var(--ink)" }}>4.9</strong> from 12,400+ reviews
                  </div>
                </div>
              </div>

              <div className="lp-hero-stage">
                <div className="lp-hero-blob" />
                <div className="lp-hero-blob b2" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="lp-hero-puppy" src="/hero-puppy.png" alt="A border collie puppy resting on a red first-aid kit" />

                <div className="lp-float-card fc-1" aria-hidden="true">
                  <div className="lp-fc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></svg></div>
                  <div><div className="lp-fc-title">Emergency guidance</div><div className="lp-fc-sub">5 protocols · offline ready</div></div>
                </div>
                <div className="lp-float-card fc-2" aria-hidden="true">
                  <div className="lp-fc-icon sage"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg></div>
                  <div><div className="lp-fc-title">Quiz passed · 100%</div><div className="lp-fc-sub">Dog CPR Basics</div></div>
                </div>
                <div className="lp-float-card fc-3" aria-hidden="true">
                  <div className="lp-fc-icon cream"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" /></svg></div>
                  <div><div className="lp-fc-title">Dr. Kavitha replied</div><div className="lp-fc-sub">2 min ago · Mochi's paw</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- TRUST STRIP ---- */}
        <section className="lp-trust-strip">
          <div className="lp-wrap">
            <div className="lp-trust-row">
              <span className="lp-trust-label">Backed by veterinary professionals</span>
              <div className="lp-trust-logos">
                <span>Greenpaws</span><span>VETCARE</span><span>Pawful</span><span>ASPCA</span><span>WSAVA</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---- FEATURES ---- */}
        <section className="lp-features" id="features">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <div className="lp-sec-eyebrow">● Everything you need</div>
              <h2>The first thing you reach for, <em>when it matters most.</em></h2>
              <p>Four tools, one app. Built with vets — for the moment your pet needs you to know exactly what to do.</p>
            </div>
            <div className="lp-feature-grid">
              {FEATURES.map((f) => (
                <div className="lp-feature-card lp-reveal" key={f.title}>
                  <div className={`lp-feature-icon ${f.tone}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                  {f.action
                    ? <button type="button" className="lp-learn" onClick={f.action === "register" ? onRegister : onGuest}>{f.link}</button>
                    : <a className="lp-learn" href={f.to}>{f.link}</a>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- HOW IT WORKS ---- */}
        <section className="lp-how" id="how">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <div className="lp-sec-eyebrow">● Three steps</div>
              <h2>Ready in <em>under a minute.</em></h2>
              <p>No long forms, no medical jargon. Just answers you can act on.</p>
            </div>
            <div className="lp-steps">
              {STEPS.map((s) => (
                <div className="lp-step lp-reveal" key={s.n}>
                  <div className="lp-step-num">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- FOR VETS ---- */}
        <section className="lp-for-vets" id="vets">
          <div className="lp-wrap">
            <div className="lp-vet-grid">
              <div>
                <div className="lp-sec-eyebrow">For veterinary experts</div>
                <h2>Reach pet families <em>when it matters.</em></h2>
                <p>Manage inquiries, host live consultations, and publish content all from a single dashboard. PetAid handles the rest.</p>
                <ul className="lp-vet-list">
                  {VET_POINTS.map((p) => (
                    <li key={p.title}>
                      <div className="lp-vet-check">{check}</div>
                      <div><strong>{p.title}</strong><span>{p.sub}</span></div>
                    </li>
                  ))}
                </ul>
                <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onSignIn}>Apply to join →</button>
              </div>

              <div className="lp-vet-mock">
                <div className="lp-vet-mock-head">
                  <div>
                    <h4>Pending inquiries</h4>
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>3 waiting · avg 47s reply</span>
                  </div>
                  <span className="lp-pill">● Live</span>
                </div>
                <div className="lp-vet-mock-list">
                  {VET_QUEUE.map((q) => (
                    <div className="lp-vet-mock-item" key={q.initials}>
                      <div className="lp-vmi-avatar" style={{ background: q.bg }}>{q.initials}</div>
                      <div><div className="lp-vmi-name">{q.name}</div><div className="lp-vmi-meta">{q.meta}</div></div>
                      {q.dot && <div className="lp-vmi-dot" />}
                      <div className="lp-vmi-time">{q.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- STATS ---- */}
        <section className="lp-stats" id="stats">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <div className="lp-sec-eyebrow">● Real impact</div>
              <h2>200,000+ pets <em>better looked after.</em></h2>
              <p>Numbers from our first 18 months, audited by the Veterinary Association.</p>
            </div>
            <div className="lp-stat-grid">
              {STATS.map((s, i) => (
                <div key={i}>
                  <div className="lp-stat-num">{s.num}</div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- TESTIMONIALS ---- */}
        <section className="lp-testimonials">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <div className="lp-sec-eyebrow">● Loved by families</div>
              <h2>From the people <em>who needed it.</em></h2>
            </div>
            <div className="lp-test-grid">
              {TESTIMONIALS.map((t) => (
                <div className="lp-test-card lp-reveal" key={t.name}>
                  <div className="lp-test-stars">★★★★★</div>
                  <p className="lp-test-body">{t.body}</p>
                  <div className="lp-test-author">
                    <div className="lp-test-avatar" style={t.initials ? { background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 14 } : undefined}>{t.initials || t.emoji}</div>
                    <div><div className="lp-test-name">{t.name}</div><div className="lp-test-role">{t.role}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- FAQ ---- */}
        <section className="lp-faq" id="faq">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <div className="lp-sec-eyebrow">● Common questions</div>
              <h2>Anything we didn&apos;t answer?</h2>
            </div>
            <div className="lp-faq-list">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div className={`lp-faq-item ${open ? "open" : ""}`} key={f.q}>
                    <button type="button" className="lp-faq-q" aria-expanded={open} onClick={() => setOpenFaq(open ? null : i)}>
                      <span>{f.q}</span>
                      <div className="lp-faq-toggle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                      </div>
                    </button>
                    <div className="lp-faq-a">{f.a}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---- BIG CTA ---- */}
        <section className="lp-cta">
          <div className="lp-wrap">
            <h2>Be ready, <em>before you need to be.</em></h2>
            <p>Join 200,000+ families who trust PetAid with the most important member of their household.</p>
            <div className="lp-hero-ctas" style={{ justifyContent: "center", marginBottom: 0 }}>
              <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onRegister}>Get started — free</button>
              <button type="button" className="lp-btn lp-btn-ghost lp-btn-lg" onClick={onGuest}>Try as guest</button>
            </div>
          </div>
        </section>

        {/* ---- FOOTER ---- */}
        <footer className="lp-footer">
          <div className="lp-wrap">
            <div className="lp-foot-grid">
              <div className="lp-foot-brand">
                <div className="lp-brand">
                  <span className="lp-brand-mark"><Image src="/petaid-logo.png" alt="" width={36} height={36} /></span>
                  <span className="lp-brand-name">PetAid</span>
                </div>
                <p>First-aid guidance, vet chat, and learning — for every pet, everywhere. Free and open to all.</p>
                <div className="lp-foot-social">
                  <a href="#top" aria-label="Instagram"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>
                  <a href="#top" aria-label="X / Twitter"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 16M20 4 4 20" /></svg></a>
                  <a href="#top" aria-label="Facebook"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" /></svg></a>
                  <a href="#top" aria-label="YouTube"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg></a>
                </div>
              </div>
              <div className="lp-foot-col">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how">How it works</a></li>
                  <li><button type="button" onClick={onGuest}>Try the app</button></li>
                  <li><a href="#top">Mobile (coming soon)</a></li>
                </ul>
              </div>
              <div className="lp-foot-col">
                <h4>For vets</h4>
                <ul>
                  <li><a href="#vets">Become a vet</a></li>
                  <li><a href="#vets">Vet dashboard tour</a></li>
                  <li><button type="button" onClick={onSignIn}>Partner portal</button></li>
                  <li><a href="#vets">Vet handbook</a></li>
                </ul>
              </div>
              <div className="lp-foot-col">
                <h4>Resources</h4>
                <ul>
                  <li><button type="button" onClick={onGuest}>First-aid library</button></li>
                  <li><a href="#faq">FAQ</a></li>
                  <li><a href="#top">Blog</a></li>
                  <li><a href="#top">Help center</a></li>
                </ul>
              </div>
              <div className="lp-foot-col">
                <h4>Company</h4>
                <ul>
                  <li><a href="#top">About</a></li>
                  <li><a href="#top">Press kit</a></li>
                  <li><a href="#top">Careers</a></li>
                  <li><a href="#top">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="lp-foot-bar">
              <span>© 2026 PetAid. Made with care for pets everywhere.</span>
              <div className="lp-foot-legal">
                <a href="#top">Privacy policy</a>
                <a href="#top">Terms of service</a>
                <a href="#top">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
