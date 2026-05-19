"use client";

import { FormEvent, useEffect, useState } from "react";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api } from "@/lib/api";
import type { Donation } from "@/lib/types";

const PRESETS = [10, 25, 50, 100];

export default function DonationsPage() {
  const [history, setHistory] = useState<Donation[]>([]);
  const [amount, setAmount] = useState("25");
  const [currency, setCurrency] = useState("USD");
  const [recurring, setRecurring] = useState(false);
  const [last, setLast] = useState<Donation | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    api.donations().then(setHistory).catch((e) => setErr(asMsg(e)));
  }
  useEffect(load, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents < 100) {
      setErr("Minimum donation is $1.00.");
      return;
    }
    try {
      const d = await api.donate(cents, currency, recurring);
      setLast(d);
      load();
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Support the Veterinary Association</div>
          <div className={s.wSub}>
            All transactions are processed by a mock provider in the Assignment 3 build
          </div>
        </div>
      </div>

      <form
        onSubmit={submit}
        style={{
          background: "var(--card)",
          border: "0.5px solid var(--border2)",
          borderRadius: 12,
          padding: 18,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border:
                  amount === String(p)
                    ? "1.5px solid var(--coral)"
                    : "1px solid var(--border2)",
                background: "var(--card)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ${p}
            </button>
          ))}
        </div>
        <label style={lbl}>Amount</label>
        <input
          type="number"
          min={1}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={inp}
        />
        <label style={lbl}>Currency</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inp}>
          {["USD", "EUR", "MYR", "SGD", "GBP"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          Make this a monthly recurring donation
        </label>

        {err && <div className="err">{err}</div>}

        <button type="submit" style={{ ...btn, marginTop: 14, width: "100%" }}>
          Donate now
        </button>
      </form>

      {last && (
        <div
          style={{
            background: "var(--teal-bg)",
            border: "0.5px solid var(--teal)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          ✓ Donation of ${(last.amount_cents / 100).toFixed(2)} {last.currency} processed.
          Reference: <code>{last.transaction_ref}</code>
        </div>
      )}

      <div style={{ fontWeight: 600, fontSize: 13, margin: "14px 0 8px" }}>Past donations</div>
      {history.length === 0 ? (
        <Empty>No donations yet.</Empty>
      ) : (
        history.map((d) => (
          <div
            key={d.id}
            style={{
              background: "var(--card)",
              border: "0.5px solid var(--border2)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <div>
              ${(d.amount_cents / 100).toFixed(2)} {d.currency}
              <div style={{ color: "var(--t3)", fontSize: 11 }}>
                {d.transaction_ref || "—"}
              </div>
            </div>
            <div
              style={{
                color:
                  d.status === "succeeded"
                    ? "var(--teal)"
                    : d.status === "failed"
                      ? "var(--red)"
                      : "var(--t3)",
                fontWeight: 500,
              }}
            >
              {d.status}
            </div>
          </div>
        ))
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
  padding: "10px 14px",
  background: "var(--black)",
  color: "var(--ivory)",
  borderRadius: 10,
  fontSize: 13,
};

function asMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Failed";
}
