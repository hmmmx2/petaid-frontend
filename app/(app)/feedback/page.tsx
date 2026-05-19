"use client";

import { FormEvent, useEffect, useState } from "react";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api, getRole } from "@/lib/api";
import type { FirstAidGuidance, Resource } from "@/lib/types";

type Target = { kind: "resource" | "guidance"; id: string; label: string };

export default function FeedbackPage() {
  const isVet = getRole() === "veterinary_expert";
  return isVet ? <VetFeedback /> : <PetOwnerFeedback />;
}

function PetOwnerFeedback() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [guidance, setGuidance] = useState<FirstAidGuidance[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.resources(), api.firstAid()])
      .then(([r, g]) => {
        setResources(r);
        setGuidance(g);
      })
      .catch((e) => setErr(asMsg(e)));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!target) {
      setErr("Pick a target first.");
      return;
    }
    try {
      await api.submitFeedback({
        target_type: target.kind,
        target_id: target.id,
        rating,
        comment,
        flagged,
      });
      setDone(true);
      setComment("");
      setRating(5);
      setFlagged(false);
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Submit feedback</div>
          <div className={s.wSub}>Rate a resource or a first-aid guidance you used</div>
        </div>
      </div>

      <form
        onSubmit={submit}
        style={{
          background: "var(--card)",
          border: "0.5px solid var(--border2)",
          borderRadius: 12,
          padding: 18,
        }}
      >
        <label style={lbl}>Target</label>
        <select
          value={target ? `${target.kind}:${target.id}` : ""}
          onChange={(e) => {
            const [kind, id] = e.target.value.split(":");
            if (kind === "resource" || kind === "guidance") {
              const label =
                kind === "resource"
                  ? resources.find((r) => r.id === id)?.title ?? ""
                  : guidance.find((g) => g.id === id)?.title ?? "";
              setTarget({ kind, id, label });
            } else {
              setTarget(null);
            }
          }}
          required
          style={inp}
        >
          <option value="">— select —</option>
          <optgroup label="Resources">
            {resources.map((r) => (
              <option key={r.id} value={`resource:${r.id}`}>
                {r.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="First Aid Guidance">
            {guidance.map((g) => (
              <option key={g.id} value={`guidance:${g.id}`}>
                {g.title}
              </option>
            ))}
          </optgroup>
        </select>

        <label style={lbl}>Rating</label>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: rating >= n ? "var(--coral)" : "var(--tech)",
                color: rating >= n ? "#fff" : "var(--t2)",
              }}
            >
              ★
            </button>
          ))}
        </div>

        <label style={lbl}>Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          style={{ ...inp, resize: "vertical" }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={flagged}
            onChange={(e) => setFlagged(e.target.checked)}
          />
          Flag this content for vet review (inaccurate / unsafe)
        </label>

        {done && (
          <div style={{ color: "var(--teal)", fontSize: 12, marginTop: 10 }}>
            ✓ Feedback submitted. Thank you.
          </div>
        )}
        {err && <div className="err">{err}</div>}

        <button type="submit" style={{ ...btn, marginTop: 14 }}>
          Submit feedback
        </button>
      </form>
    </>
  );
}

function VetFeedback() {
  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Feedback review</div>
          <div className={s.wSub}>Flagged feedback also surfaces on the dashboard</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--t3)", padding: 16 }}>
        Open the dashboard to review flagged feedback.
      </div>
    </>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 11, color: "var(--t2)", margin: "10px 0 4px" };
const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border2)",
  background: "var(--tech)",
  fontSize: 13,
};
const btn: React.CSSProperties = {
  padding: "10px 14px",
  background: "var(--black)",
  color: "var(--ivory)",
  borderRadius: 10,
  fontSize: 13,
};

function asMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Failed";
}
