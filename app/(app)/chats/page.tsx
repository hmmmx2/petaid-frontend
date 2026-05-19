"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api, getRole } from "@/lib/api";
import type { Chat } from "@/lib/types";

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [subject, setSubject] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const isVet = getRole() === "veterinary_expert";

  function load() {
    api.chats().then(setChats).catch((e) => setErr(asMsg(e)));
  }
  useEffect(load, []);

  async function start(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await api.createChat(subject);
      setSubject("");
      load();
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Chats</div>
          <div className={s.wSub}>
            {isVet ? "Active sessions you can join" : "Open a synchronous chat with a vet"}
          </div>
        </div>
      </div>

      {!isVet && (
        <form
          onSubmit={start}
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border2)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
            display: "flex",
            gap: 8,
          }}
        >
          <input
            placeholder="What's this chat about?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={160}
            required
            style={{ ...inp, flex: 1 }}
          />
          <button type="submit" style={btn}>Start chat</button>
        </form>
      )}

      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

      {chats.length === 0 ? (
        <Empty>No chats yet.</Empty>
      ) : (
        chats.map((c) => (
          <Link
            key={c.id}
            href={`/chats/${c.id}`}
            style={{
              display: "block",
              textDecoration: "none",
              background: "var(--card)",
              border: "0.5px solid var(--border2)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.subject || "(no subject)"}</div>
              <div style={{ fontSize: 11, color: "var(--t3)" }}>{c.status}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>
              Started {new Date(c.started_at).toLocaleString()}
            </div>
          </Link>
        ))
      )}
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "var(--t3)", padding: 16 }}>{children}</div>;
}

const btn: React.CSSProperties = {
  padding: "8px 14px",
  background: "var(--black)",
  color: "var(--ivory)",
  borderRadius: 8,
  fontSize: 12,
};
const inp: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border2)",
  background: "var(--tech)",
  fontSize: 13,
};

function asMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Failed";
}
