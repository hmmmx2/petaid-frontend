"use client";

import { useState } from "react";
import Link from "next/link";
import s from "@/app/(app)/dashboard.module.css";
import type { UserSummary, VetPanels } from "@/lib/types";
import { api, ApiError } from "@/lib/api";

type Props = { user: UserSummary; panels: VetPanels; onChanged?: () => void };

export function VeterinaryDashboard({ user, panels, onChanged }: Props) {
  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Welcome back, Dr. {user.display_name}</div>
          <div className={s.wSub}>Queue overview · review and respond</div>
        </div>
      </div>

      <div className={s.statRow}>
        <StatCard
          label="PENDING INQUIRIES"
          value={panels.stats.pending_inquiries}
          bg="#FDECEA"
          fg="#b84c36"
        />
        <StatCard
          label="ACTIVE CHATS"
          value={panels.stats.active_chats}
          bg="#E1F5EE"
          fg="#0F6E56"
        />
        <StatCard
          label="DRAFTS AWAITING APPROVAL"
          value={panels.stats.drafts_awaiting_approval}
          bg="#EEEDFE"
          fg="#3C3489"
        />
      </div>

      <Section title="Pending Inquiries">
        {panels.pending_inquiries.length === 0 ? (
          <Empty>No pending inquiries.</Empty>
        ) : (
          panels.pending_inquiries.map((i) => (
            <Row key={i.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={s.chatName}>
                  {i.subject}
                  <span className={s.chatTime}>
                    {new Date(i.submitted_at).toLocaleString()}
                  </span>
                </div>
                <div className={s.chatPrev}>From {i.from}: {i.question}</div>
              </div>
              <Link href={`/inquiries/${i.id}`} className={badgeStyle("#FDECEA", "#b84c36")}>
                Respond
              </Link>
            </Row>
          ))
        )}
      </Section>

      <Section title="Active Chats">
        {panels.active_chats.length === 0 ? (
          <Empty>No active chats.</Empty>
        ) : (
          panels.active_chats.map((c) => (
            <Row key={c.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={s.chatName}>
                  {c.subject || "(no subject)"}
                  <span className={s.chatTime}>{c.status}</span>
                </div>
                <div className={s.chatPrev}>From {c.owner}</div>
              </div>
              <Link href={`/chats/${c.id}`} className={badgeStyle("#E1F5EE", "#0F6E56")}>
                Join
              </Link>
            </Row>
          ))
        )}
      </Section>

      <Section title="Draft Resources">
        {panels.draft_resources.length === 0 ? (
          <Empty>No drafts awaiting approval.</Empty>
        ) : (
          panels.draft_resources.map((r) => (
            <DraftRow key={r.id} resource={r} onChanged={onChanged} />
          ))
        )}
      </Section>

      <Section title="Flagged Feedback">
        {panels.flagged_feedback.length === 0 ? (
          <Empty>No feedback flagged for review.</Empty>
        ) : (
          panels.flagged_feedback.map((f) => (
            <Row key={f.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={s.chatName}>
                  {f.target_type === "resource" ? "Resource" : "Guidance"} feedback
                  {f.rating != null && <span className={s.chatTime}>★ {f.rating}/5</span>}
                </div>
                <div className={s.chatPrev}>From {f.from}: {f.comment || "(no comment)"}</div>
              </div>
            </Row>
          ))
        )}
      </Section>

      <Section title="Recent Donations">
        {panels.donations.length === 0 ? (
          <Empty>No donations yet.</Empty>
        ) : (
          panels.donations.map((d) => (
            <Row key={d.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={s.chatName}>
                  ${d.amount.toFixed(2)} {d.currency}
                  <span className={s.chatTime}>
                    {d.processed_at && new Date(d.processed_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={s.chatPrev}>From {d.donor} · ref {d.transaction_ref}</div>
              </div>
            </Row>
          ))
        )}
      </Section>
    </>
  );
}

function DraftRow({
  resource,
  onChanged,
}: {
  resource: VetPanels["draft_resources"][number];
  onChanged?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function publish() {
    setPending(true);
    setErr(null);
    try {
      await api.publishResource(resource.id);
      onChanged?.();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Row>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={s.chatName}>
          {resource.title}
          <span className={s.chatTime}>{resource.kind}</span>
        </div>
        <div className={s.chatPrev}>For {resource.pet_type}</div>
        {err && <div style={{ color: "var(--red)", fontSize: 11 }}>{err}</div>}
      </div>
      <button
        onClick={publish}
        disabled={pending}
        className={badgeStyle("#EEEDFE", "#3C3489")}
        style={{ border: "none", cursor: "pointer" }}
      >
        {pending ? "Publishing…" : "Publish"}
      </button>
    </Row>
  );
}

// --- tiny presentational helpers ------------------------------------------ //
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", border: "0.5px solid var(--border2)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderBottom: "0.5px solid var(--border)" }}>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "var(--t3)", padding: "8px 0" }}>{children}</div>;
}

function StatCard({ label, value, bg, fg }: { label: string; value: number | string; bg: string; fg: string }) {
  return (
    <div className={s.sc} style={{ background: bg }}>
      <div className={s.scLbl} style={{ color: fg }}>{label}</div>
      <div className={s.scNum} style={{ color: fg }}>{value}</div>
    </div>
  );
}

function badgeStyle(bg: string, fg: string): string {
  // inline className that mimics res-badge
  return s.resBadge;
}
