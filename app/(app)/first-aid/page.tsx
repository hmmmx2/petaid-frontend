"use client";

import { useEffect, useState } from "react";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api } from "@/lib/api";
import type { FirstAidGuidance, PetType } from "@/lib/types";

export default function FirstAidPage() {
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [guidance, setGuidance] = useState<FirstAidGuidance[]>([]);
  const [active, setActive] = useState<FirstAidGuidance | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.petTypes().then(setPetTypes).catch((e) => setErr(asMsg(e)));
  }, []);

  useEffect(() => {
    api
      .firstAid(selected || undefined)
      .then(setGuidance)
      .catch((e) => setErr(asMsg(e)));
  }, [selected]);

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Emergency First Aid</div>
          <div className={s.wSub}>Select a pet type, then a protocol</div>
        </div>
      </div>

      <div className={s.petsRow}>
        <button
          onClick={() => setSelected("")}
          className={s.petPill}
          style={{ border: selected === "" ? "1.5px solid var(--coral)" : undefined }}
        >
          <div className={s.petIcon}>🐾</div>
          <div className={s.petName}>All</div>
        </button>
        {petTypes.map((pt) => (
          <button
            key={pt.id}
            onClick={() => setSelected(pt.id)}
            className={s.petPill}
            style={{ border: selected === pt.id ? "1.5px solid var(--coral)" : undefined }}
          >
            <div className={s.petIcon} style={{ background: pt.icon_bg }}>
              {pt.icon_emoji}
            </div>
            <div className={s.petName}>{pt.name}</div>
          </button>
        ))}
      </div>

      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          {guidance.length === 0 ? (
            <Empty>No guidance available for this filter.</Empty>
          ) : (
            guidance.map((g) => (
              <div
                key={g.id}
                onClick={() => setActive(g)}
                style={{
                  background: "var(--card)",
                  border:
                    active?.id === g.id
                      ? "1.5px solid var(--coral)"
                      : "0.5px solid var(--border2)",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{g.title}</div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>
                  {g.emergency_type} · {g.pet_type.name}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border2)",
            borderRadius: 12,
            padding: 18,
            minHeight: 200,
          }}
        >
          {active ? (
            <>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                {active.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 12 }}>
                {active.summary}
              </div>
              <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
                {active.steps.map((step, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {step}
                  </li>
                ))}
              </ol>
              {active.resources.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "0.5px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 6 }}>
                    SUPPORTING RESOURCES
                  </div>
                  {active.resources.map((r) => (
                    <div key={r.id} style={{ fontSize: 12, padding: "4px 0" }}>
                      • {r.title} ({r.content_type})
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Empty>Select a protocol to view the steps.</Empty>
          )}
        </div>
      </div>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "var(--t3)", padding: 16 }}>{children}</div>;
}

function asMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed";
}
