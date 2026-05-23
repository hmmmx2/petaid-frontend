"use client";

/* Shared rich chat thread used by BOTH the Pet Owner and Vet dashboards so the
 * two sides render identically (DRY — replaces the old text-only ChatModal /
 * VetChatModal bodies). Social-media-style: grouped bubbles with avatars +
 * timestamps + day separators, in-chat photos with a lightbox, auto-scroll +
 * "new messages" pill, a "Seen" receipt, a live typing row, peer presence in
 * the header, and a multiline composer (Enter to send, Shift+Enter for a
 * newline) with photo attach. Reads/writes flow through useChatRealtime():
 * writes still hit the REST controller (RBAC + rate limits) and the WebSocket
 * echoes them back to both participants in real time. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BusyButton, Icon, Modal, fileToDownscaledDataUrl, relTime, useToast } from "@/components/ui";
import { useChatRealtime } from "@/lib/chatRealtime";
import type { Chat, ChatMessage } from "@/lib/petaid";

/* ---------- small formatters ---------- */
const initialsOf = (name: string) =>
  (name || "?").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";

const clock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const dayLabel = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

const GROUP_GAP = 5 * 60 * 1000; // start a new visual group after a 5-min gap

type Row = ChatMessage & { firstInGroup: boolean; lastInGroup: boolean; daySep: boolean; mine: boolean };

function buildRows(messages: ChatMessage[], myId: string): Row[] {
  const sorted = [...messages].sort((a, b) => a.at - b.at);
  return sorted.map((m, i) => {
    const prev = sorted[i - 1];
    const next = sorted[i + 1];
    const daySep = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString();
    const firstInGroup = daySep || !prev || prev.senderId !== m.senderId || m.at - prev.at > GROUP_GAP;
    const lastInGroup =
      !next ||
      next.senderId !== m.senderId ||
      next.at - m.at > GROUP_GAP ||
      new Date(next.at).toDateString() !== new Date(m.at).toDateString();
    return { ...m, daySep, firstInGroup, lastInGroup, mine: m.senderId === myId };
  });
}

/* ---------- component ---------- */
export function ChatThread({
  chat,
  myId,
  title,
  peerName,
  onClose,
  onCloseChat,
  onBeforeSend,
  waitingBanner,
  emptyHint = "Send the first message to start the conversation.",
}: {
  chat: Chat;
  myId: string;
  title: string;
  peerName: string;
  onClose: () => void;
  onCloseChat: () => Promise<void>;
  onBeforeSend?: (chat: Chat) => Promise<void>;
  waitingBanner?: ReactNode;
  emptyHint?: string;
}) {
  const { sendMessage, markRead, sendTyping, typingAccount, presenceFor, setActiveChatId } = useChatRealtime();
  const { push } = useToast();

  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingFlag = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLen = useRef(chat.messages.length);

  const closed = chat.status === "closed";
  const iAmOwner = myId === chat.ownerId;
  const peerId = iAmOwner ? chat.vetId : chat.ownerId;
  const peerLastRead = iAmOwner ? chat.vetLastRead : chat.ownerLastRead;
  const presence = presenceFor(peerId);
  const typer = typingAccount(chat.id);
  const peerTyping = !!typer && typer !== myId;

  const rows = buildRows(chat.messages, myId);
  const lastMine = [...rows].reverse().find((r) => r.mine) || null;
  const seen = !!(lastMine && peerLastRead && peerLastRead >= lastMine.at);

  /* register as the active chat so the realtime layer auto-reads incoming
     messages while open; mark the existing backlog read on open. */
  useEffect(() => {
    setActiveChatId(chat.id);
    markRead(chat.id);
    return () => setActiveChatId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id]);

  /* auto-scroll: jump to bottom on open + when a new message arrives while the
     user is already near the bottom (or it's their own); otherwise badge it. */
  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };
  useLayoutEffect(() => {
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const len = chat.messages.length;
    if (len > prevLen.current) {
      const last = chat.messages[len - 1];
      if (atBottom || last?.senderId === myId) {
        scrollToBottom("smooth");
        setNewCount(0);
      } else {
        setNewCount((n) => n + (len - prevLen.current));
      }
    }
    prevLen.current = len;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setNewCount(0);
  };

  /* typing relay — fire "true" on first keystroke, auto-clear after idle. */
  const flagTyping = () => {
    if (closed) return;
    if (!typingFlag.current) {
      typingFlag.current = true;
      sendTyping(chat.id, true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingFlag.current = false;
      sendTyping(chat.id, false);
    }, 2500);
  };
  const stopTyping = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (typingFlag.current) {
      typingFlag.current = false;
      sendTyping(chat.id, false);
    }
  };
  useEffect(() => () => stopTyping(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const pickPhoto = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setReading(true);
    try { setImage(await fileToDownscaledDataUrl(files[0])); }
    catch { push("Couldn't read that image. Try another file.", "danger"); }
    finally { setReading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const send = async () => {
    const body = text.trim();
    if ((!body && !image) || closed) return;
    setText("");
    const img = image;
    setImage(null);
    stopTyping();
    try {
      if (onBeforeSend) await onBeforeSend(chat);
      await sendMessage(chat.id, body, img);
      scrollToBottom("smooth");
    } catch (e) {
      // restore the draft so nothing is lost
      setText(body);
      setImage(img);
      push(e instanceof Error ? e.message : "Message failed to send.", "danger");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Auto-grow the composer up to a cap so multiline drafts stay visible.
  const autoGrow = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };
  useEffect(() => { if (!text) autoGrow(); }, [text]);

  const presenceText = closed
    ? "Chat ended"
    : presence.online
      ? "Active now"
      : presence.lastSeen
        ? `Active ${relTime(presence.lastSeen)}`
        : peerId
          ? "Offline"
          : "Waiting to connect";

  const subtitle = (
    <span className="ct-sub">
      <span className={`ct-pdot ${presence.online && !closed ? "on" : ""}`} aria-hidden="true" />
      {presenceText}
    </span>
  );

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      wide
      footer={
        closed
          ? <button className="btn-secondary" onClick={onClose}>Close</button>
          : <BusyButton className="btn-secondary" onClick={onCloseChat} busyLabel="Ending…">End chat</BusyButton>
      }
    >
      {chat.status === "initiated" && waitingBanner}

      <div className="ct-shell">
      <div className="ct-thread" ref={scrollRef} onScroll={onScroll}>
        {rows.length === 0 && (
          <div className="ct-empty">{emptyHint}</div>
        )}
        {rows.map((r) => (
          <div key={r.id}>
            {r.daySep && <div className="ct-day"><span>{dayLabel(r.at)}</span></div>}
            <div className={`ct-row ${r.mine ? "mine" : "theirs"} ${r.lastInGroup ? "tail" : ""}`}>
              {!r.mine && (
                <div className="ct-avatar" aria-hidden="true">
                  {r.lastInGroup ? initialsOf(peerName) : ""}
                </div>
              )}
              <div className="ct-bubble-wrap">
                <div className={`ct-bubble ${r.mine ? "mine" : "theirs"} ${r.image ? "has-image" : ""}`}>
                  {r.image && (
                    <button type="button" className="ct-img-btn" onClick={() => setZoom(r.image)} aria-label="View photo">
                      <img src={r.image} alt="Shared photo" className="ct-img" />
                    </button>
                  )}
                  {r.text && <span className="ct-text">{r.text}</span>}
                </div>
                {r.lastInGroup && (
                  <div className="ct-meta">
                    <span className="ct-time">{clock(r.at)}</span>
                    {r.mine && r.id === lastMine?.id && (
                      <span className={`ct-seen ${seen ? "is-seen" : ""}`}>{seen ? "Seen" : "Sent"}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {peerTyping && (
          <div className="ct-row theirs tail">
            <div className="ct-avatar" aria-hidden="true">{initialsOf(peerName)}</div>
            <div className="ct-bubble-wrap">
              <div className="ct-bubble theirs ct-typing" aria-label={`${peerName} is typing`}>
                <span className="ct-dot" /><span className="ct-dot" /><span className="ct-dot" />
              </div>
            </div>
          </div>
        )}
      </div>

      {newCount > 0 && (
        <button type="button" className="ct-newpill" onClick={() => { scrollToBottom("smooth"); setNewCount(0); }}>
          <Icon name="chevron" size={13} style={{ transform: "rotate(90deg)" }} /> {newCount} new message{newCount > 1 ? "s" : ""}
        </button>
      )}
      </div>

      {closed ? (
        <div className="ct-closed">This chat has ended — it is read-only.</div>
      ) : (
        <div className="ct-composer">
          {image && (
            <div className="ct-attach-preview">
              <img src={image} alt="Attachment preview" />
              <button type="button" aria-label="Remove photo" onClick={() => setImage(null)}>×</button>
            </div>
          )}
          <div className="ct-composer-row">
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickPhoto(e.target.files)} />
            <button type="button" className="ct-attach" onClick={() => fileRef.current?.click()} disabled={reading} aria-label="Attach a photo" title="Attach a photo">
              {reading ? "…" : <Icon name="upload" size={16} />}
            </button>
            <textarea
              ref={inputRef}
              className="ct-input"
              value={text}
              onChange={(e) => { setText(e.target.value); flagTyping(); autoGrow(); }}
              onKeyDown={onKeyDown}
              onBlur={stopTyping}
              placeholder="Type a message…  (Enter to send, Shift+Enter for a new line)"
              rows={1}
              maxLength={2000}
            />
            <BusyButton className="ct-send" onClick={send} disabled={!text.trim() && !image} aria-label="Send message">
              <Icon name="send" size={15} />
            </BusyButton>
          </div>
        </div>
      )}

      {zoom && (
        <div onClick={() => setZoom(null)} role="dialog" aria-label="Photo preview"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 250, display: "grid", placeItems: "center", padding: 24, cursor: "zoom-out" }}>
          <img src={zoom} alt="Shared photo" style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 12 }} />
        </div>
      )}
    </Modal>
  );
}
