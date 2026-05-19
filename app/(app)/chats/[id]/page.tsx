"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api, getRole } from "@/lib/api";
import type { Chat } from "@/lib/types";

export default function ChatRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [chat, setChat] = useState<Chat | null>(null);
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const isVet = getRole() === "veterinary_expert";
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!params?.id) return;
    try {
      const c = await api.chatById(params.id);
      setChat(c);
    } catch (e) {
      setErr(asMsg(e));
    }
  }, [params]);

  useEffect(() => {
    void load();
    pollRef.current = window.setInterval(load, 3000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [load]);

  async function join() {
    if (!chat) return;
    try {
      await api.joinChat(chat.id);
      load();
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!chat) return;
    try {
      await api.postChatMessage(chat.id, body);
      setBody("");
      load();
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  async function close() {
    if (!chat) return;
    if (!confirm("Close this chat session?")) return;
    await api.closeChat(chat.id);
    router.push("/chats");
  }

  if (!chat) return <div className={s.loading}>Loading chat…</div>;

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>{chat.subject || "Chat"}</div>
          <div className={s.wSub}>Status: {chat.status}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isVet && chat.status === "initiated" && (
            <button onClick={join} style={btn}>Join chat</button>
          )}
          {chat.status !== "closed" && (
            <button onClick={close} style={btnGhost}>Close</button>
          )}
        </div>
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "0.5px solid var(--border2)",
          borderRadius: 12,
          padding: 14,
          minHeight: 360,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {chat.messages.length === 0 && (
          <Empty>
            {chat.status === "initiated"
              ? "Waiting for a vet to join…"
              : "No messages yet. Say hello."}
          </Empty>
        )}
        {chat.messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: "flex-start",
              maxWidth: "70%",
              background: "var(--tech)",
              padding: "8px 12px",
              borderRadius: 12,
              fontSize: 13,
            }}
          >
            <div>{m.body}</div>
            <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 2 }}>
              {new Date(m.sent_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}

      {chat.status !== "closed" && (
        <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            maxLength={2000}
            required
            style={{ ...inp, flex: 1 }}
          />
          <button type="submit" style={btn}>Send</button>
        </form>
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
const btnGhost: React.CSSProperties = { ...btn, background: "var(--tech)", color: "var(--t1)" };
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
