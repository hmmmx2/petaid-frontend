"use client";

import { FormEvent, useEffect, useState } from "react";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api, getRole } from "@/lib/api";
import type { Inquiry } from "@/lib/types";

export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [responding, setResponding] = useState<Inquiry | null>(null);
  const [respondText, setRespondText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const isVet = getRole() === "veterinary_expert";

  function load() {
    api.inquiries().then(setItems).catch((e) => setErr(asMsg(e)));
  }
  useEffect(load, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    try {
      await api.createInquiry(subject, question);
      setSubject("");
      setQuestion("");
      load();
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  async function respond() {
    if (!responding) return;
    try {
      await api.respondInquiry(responding.id, respondText);
      setResponding(null);
      setRespondText("");
      load();
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Inquiries</div>
          <div className={s.wSub}>
            {isVet ? "Pending questions from Pet Owners" : "Ask a vet — replies arrive in this thread"}
          </div>
        </div>
      </div>

      {!isVet && (
        <form
          onSubmit={submit}
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border2)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <label style={lbl}>Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={160}
            required
            style={inp}
          />
          <label style={lbl}>Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            maxLength={4000}
            required
            style={{ ...inp, resize: "vertical" }}
          />
          {err && <div className="err">{err}</div>}
          <button type="submit" style={{ ...btn, marginTop: 12 }}>
            Submit inquiry
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <Empty>No inquiries yet.</Empty>
      ) : (
        items.map((i) => (
          <div
            key={i.id}
            style={{
              background: "var(--card)",
              border: "0.5px solid var(--border2)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{i.subject}</div>
              <div style={{ fontSize: 11, color: "var(--t3)" }}>{i.status}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 8 }}>{i.question}</div>
            {i.response && (
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  background: "var(--teal-bg)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                <strong>Vet response:</strong> {i.response}
              </div>
            )}
            {isVet && i.status === "pending" && (
              <button onClick={() => setResponding(i)} style={{ ...btn, marginTop: 8 }}>
                Respond
              </button>
            )}
          </div>
        ))
      )}

      {responding && (
        <div style={modal}>
          <div style={modalCard}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Respond to: {responding.subject}</div>
            <textarea
              value={respondText}
              onChange={(e) => setRespondText(e.target.value)}
              rows={5}
              style={{ ...inp, resize: "vertical" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={respond} style={btn}>Send response</button>
              <button onClick={() => setResponding(null)} style={btnGhost}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "var(--t3)", padding: 16 }}>{children}</div>;
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
  padding: "8px 14px",
  background: "var(--black)",
  color: "var(--ivory)",
  borderRadius: 8,
  fontSize: 12,
};
const btnGhost: React.CSSProperties = { ...btn, background: "var(--tech)", color: "var(--t1)" };
const modal: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};
const modalCard: React.CSSProperties = {
  background: "var(--card)",
  borderRadius: 12,
  padding: 20,
  width: "min(480px, 92vw)",
};

function asMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Failed";
}
