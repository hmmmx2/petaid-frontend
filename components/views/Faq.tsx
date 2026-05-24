"use client";

/* Searchable, categorised FAQ accordion (help-center style) shown as a tab in
   the Vet Chat page so owners can self-serve before starting a chat. */
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";

type QA = { q: string; a: string };
type Category = { title: string; items: QA[] };

const FAQ: Category[] = [
  {
    title: "Using the vet chat",
    items: [
      { q: "How do I start a chat?", a: "Open Vet Chat and tap “Start new chat”. Choose a topic (pet first-aid advice or customer support), pick who you'd like to reach — a specific expert or “Any available expert” — and add an optional note describing your situation." },
      { q: "Who am I chatting with?", a: "A registered veterinary expert. Their name and live status (active now / last active) appear at the top of the conversation. “Customer support” questions are also handled by the veterinary team." },
      { q: "What's the difference between “advice” and “support”?", a: "Pet first-aid advice is medical guidance about your pet's condition. Customer support is for account help and general questions. Picking the right topic helps route your message to the right person faster." },
      { q: "Are messages delivered in real time?", a: "Yes. Messages, typing indicators, read receipts (“Seen”) and the expert's online status all update instantly — no need to refresh." },
      { q: "Can I share a photo?", a: "Yes — use the attach button in the message box to add a photo of your pet's condition. Tap any photo in the thread to view it full-size." },
      { q: "Can I edit or delete a message I sent?", a: "Yes. Hover (or tap) your own message to reveal Edit and Delete. Edited messages show a small “(edited)” label; deleting removes the message for both of you." },
      { q: "Can I delete a whole conversation?", a: "Yes — open the conversation and choose “Delete chat”. This permanently removes the conversation and its messages for both participants." },
      { q: "What does “Seen” mean?", a: "It means the expert has read your most recent message. Until then it shows “Sent”." },
    ],
  },
  {
    title: "Pet first-aid basics",
    items: [
      { q: "Is PetAid a substitute for a vet?", a: "No. PetAid supports — it never replaces — professional veterinary care. In a real emergency, contact your nearest emergency veterinary clinic first, then use the guidance and chat for support." },
      { q: "What should I do in an emergency?", a: "Tap the Emergency button for step-by-step first-aid protocols filtered to your pet, follow the steps, and start a chat or call a clinic for hands-on help." },
      { q: "How is guidance chosen for my pet?", a: "Once you add a pet profile, first-aid guidance and resources are filtered to that pet's type so you see the most relevant content first." },
    ],
  },
  {
    title: "Account & privacy",
    items: [
      { q: "Is my data secure?", a: "Yes. Passwords are stored only as bcrypt hashes, all traffic is encrypted, access is permission-controlled, and sensitive actions are rate-limited. Photos are stored privately and served over secure links." },
      { q: "How do I reset my password?", a: "On the sign-in screen tap “Forgot password?”, enter your email, and use the code we send to set a new password." },
      { q: "How do I change my password?", a: "Go to Settings → Password & security, enter your current password and a new one that meets the strength requirements." },
      { q: "Do I need two-factor authentication?", a: "Veterinary experts are required to use an authenticator app at sign-in. Pet owners sign in with email and password." },
    ],
  },
];

export function FaqPanel({ onStartChat }: { onStartChat?: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();

  const cats = useMemo(
    () =>
      FAQ.map((c) => ({
        ...c,
        items: c.items.filter((it) => !q || it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)),
      })).filter((c) => c.items.length > 0),
    [q],
  );

  const toggle = (k: string) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });

  return (
    <div className="faq">
      <div className="faq-search">
        <Icon name="search" size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search frequently asked questions…" aria-label="Search FAQ" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">✕</button>}
      </div>

      {cats.length === 0 && (
        <div className="empty-state"><strong>No matching questions.</strong>Try a different search, or start a chat for personal help.</div>
      )}

      {cats.map((c) => (
        <div className="faq-cat" key={c.title}>
          <h3 className="faq-cat-title">{c.title}</h3>
          <div className="faq-list">
            {c.items.map((it) => {
              const k = `${c.title}::${it.q}`;
              const isOpen = open.has(k) || !!q; // auto-expand while searching
              return (
                <div className={`faq-item ${isOpen ? "open" : ""}`} key={k}>
                  <button type="button" className="faq-q" onClick={() => toggle(k)} aria-expanded={isOpen}>
                    <span>{it.q}</span>
                    <Icon name="chevron" size={15} className="faq-chev" />
                  </button>
                  {isOpen && <div className="faq-a">{it.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="faq-foot">
        Still need help?{" "}
        {onStartChat
          ? <button type="button" className="btn-link" onClick={onStartChat}>Start a chat</button>
          : "Start a chat"}{" "}
        and a veterinary expert will assist you.
      </div>
    </div>
  );
}
