"use client";

import { useEffect, useState } from "react";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api, getRole } from "@/lib/api";
import type { Resource } from "@/lib/types";

export default function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const isVet = getRole() === "veterinary_expert";

  function load() {
    api.resources().then(setItems).catch((e) => setErr(asMsg(e)));
  }
  useEffect(load, []);

  async function publish(id: string) {
    try {
      await api.publishResource(id);
      load();
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Resources</div>
          <div className={s.wSub}>
            {isVet ? "Manage content — drafts visible here only" : "Vet-approved learning content"}
          </div>
        </div>
      </div>

      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {items.map((r) => (
          <div
            key={r.id}
            style={{
              background: "var(--card)",
              border: "0.5px solid var(--border2)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase" }}>
              {r.content_type} · {r.pet_type.name}
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{r.title}</div>
            <div
              style={{
                fontSize: 11,
                color: r.status === "published" ? "var(--teal)" : "var(--amber)",
                marginTop: 6,
              }}
            >
              {r.status}
            </div>
            {isVet && r.status === "draft" && (
              <button onClick={() => publish(r.id)} style={btn}>Publish</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

const btn: React.CSSProperties = {
  marginTop: 10,
  padding: "6px 10px",
  background: "var(--black)",
  color: "var(--ivory)",
  borderRadius: 6,
  fontSize: 11,
};

function asMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Failed";
}
