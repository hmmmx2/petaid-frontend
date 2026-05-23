"use client";

/* Live chat state powered by the WebSocket. Seeds from GET /chats, then patches
 * locally on each WS frame (message / chat_new / chat_update / read / typing /
 * presence) so both roles get instant, social-media-style updates. Writes still
 * go through the REST controller (RBAC + rate limits); the WS echoes them back. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";

import { chatSocket } from "./chatSocket";
import { mapChat, petaid, usePetAid, type Chat, type ChatMessage } from "./petaid";

const ms = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

type Presence = { online: boolean; lastSeen: number | null };
type Typing = { accountId: string; exp: number };

type ChatRealtimeCtx = {
  chats: Chat[];
  myId: string | null;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  typingAccount: (chatId: string) => string | null;
  presenceFor: (accountId: string | null | undefined) => Presence;
  sendMessage: (chatId: string, body: string, image?: string | null) => Promise<void>;
  markRead: (chatId: string) => Promise<void>;
  sendTyping: (chatId: string, isTyping: boolean) => void;
  refreshChats: () => Promise<void>;
};

const Ctx = createContext<ChatRealtimeCtx | null>(null);

const sortChats = (cs: Chat[]) =>
  [...cs].sort((a, b) => (b.lastMessage?.at || b.startedAt) - (a.lastMessage?.at || a.startedAt));

export function ChatRealtimeProvider({ children }: { children: ReactNode }) {
  const { snapshot } = usePetAid();
  const { data: session } = useSession();
  const myId = snapshot?.account?.id ?? null;
  const token = (session as { accessToken?: string } | null)?.accessToken ?? null;

  const [chats, setChats] = useState<Chat[]>([]);
  const [, force] = useState(0);
  const [activeChatId, _setActiveChatId] = useState<string | null>(null);

  // refs so the single socket subscription always sees current values
  const activeRef = useRef<string | null>(null);
  const myIdRef = useRef<string | null>(null);
  const typingRef = useRef<Record<string, Typing>>({});
  const presenceRef = useRef<Record<string, Presence>>({});
  myIdRef.current = myId;

  const setActiveChatId = useCallback((id: string | null) => {
    activeRef.current = id;
    _setActiveChatId(id);
  }, []);

  const refreshChats = useCallback(async () => {
    if (!myId) return;
    try {
      const rows = await petaid.listChats();
      setChats(sortChats(rows.map(mapChat)));
    } catch { /* ignore */ }
  }, [myId]);

  const patchChat = useCallback((id: string, fn: (c: Chat) => Chat) => {
    setChats((prev) => sortChats(prev.map((c) => (c.id === id ? fn(c) : c))));
  }, []);

  const markRead = useCallback(async (chatId: string) => {
    // Optimistically clear my unread and advance MY OWN read cursor only. We
    // deliberately do not merge the server's ChatOut snapshot here: a concurrent
    // peer `read` WS frame may have just advanced the peer's cursor, and a stale
    // REST response would clobber it back (flipping "Seen" → "Sent"). The peer's
    // cursor is driven exclusively by their own `read` frames.
    setChats((prev) => sortChats(prev.map((c) => {
      if (c.id !== chatId) return c;
      const iAmOwner = myIdRef.current === c.ownerId;
      return {
        ...c,
        unread: 0,
        ownerLastRead: iAmOwner ? Date.now() : c.ownerLastRead,
        vetLastRead: iAmOwner ? c.vetLastRead : Date.now(),
      };
    })));
    try { await petaid.markChatRead(chatId); } catch { /* persisted best-effort */ }
  }, []);

  const sendMessage = useCallback(async (chatId: string, body: string, image?: string | null) => {
    const m = await petaid.postChatMessage(chatId, body, image ?? null);
    const msg: ChatMessage = { id: m.id, senderId: m.sender_id, text: m.body, image: m.image_url || null, at: ms(m.sent_at) };
    setChats((prev) => sortChats(prev.map((c) => {
      if (c.id !== chatId) return c;
      if (c.messages.some((x) => x.id === msg.id)) return c;
      return { ...c, messages: [...c.messages, msg], lastMessage: { senderId: msg.senderId, preview: msg.text || (msg.image ? "📷 Photo" : ""), at: msg.at } };
    })));
  }, []);

  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    chatSocket.send({ type: "typing", chat_id: chatId, is_typing: isTyping });
  }, []);

  const typingAccount = useCallback((chatId: string) => {
    const t = typingRef.current[chatId];
    return t && t.exp > Date.now() ? t.accountId : null;
  }, []);

  const presenceFor = useCallback((accountId: string | null | undefined): Presence => {
    if (!accountId) return { online: false, lastSeen: null };
    return presenceRef.current[accountId] ?? { online: false, lastSeen: null };
  }, []);

  // Seed + connect when authed; tear down on logout.
  useEffect(() => {
    if (!myId || !token) { setChats([]); chatSocket.close(); return; }
    refreshChats();
    chatSocket.connect(token);
  }, [myId, token, refreshChats]);

  // Single socket subscription (uses refs for live values).
  useEffect(() => {
    const off = chatSocket.on((m: any) => {
      const me = myIdRef.current;
      switch (m.type) {
        case "message": {
          const chatId = m.chat_id;
          const msg: ChatMessage = { id: m.message.id, senderId: m.message.sender_id, text: m.message.body, image: m.message.image_url || null, at: ms(m.message.sent_at) };
          const fromMe = msg.senderId === me;
          const isActive = activeRef.current === chatId;
          setChats((prev) => {
            const exists = prev.some((c) => c.id === chatId);
            const next = (exists ? prev : prev).map((c) => {
              if (c.id !== chatId) return c;
              const dup = c.messages.some((x) => x.id === msg.id);
              return {
                ...c,
                messages: dup ? c.messages : [...c.messages, msg],
                lastMessage: { senderId: msg.senderId, preview: msg.text || (msg.image ? "📷 Photo" : ""), at: msg.at },
                unread: !fromMe && !isActive ? c.unread + (dup ? 0 : 1) : c.unread,
              };
            });
            return sortChats(next);
          });
          if (isActive && !fromMe) markRead(chatId);
          break;
        }
        case "chat_new": {
          const c = mapChat(m.chat);
          setChats((prev) => (prev.some((x) => x.id === c.id) ? prev : sortChats([c, ...prev])));
          break;
        }
        case "chat_update":
          patchChat(m.chat_id, (c) => ({ ...c, status: m.status ?? c.status, vetId: m.vet_id ?? c.vetId }));
          break;
        case "read":
          patchChat(m.chat_id, (c) =>
            m.account_id === c.ownerId
              ? { ...c, ownerLastRead: ms(m.last_read_at) }
              : { ...c, vetLastRead: ms(m.last_read_at) },
          );
          break;
        case "typing":
          typingRef.current = { ...typingRef.current, [m.chat_id]: { accountId: m.account_id, exp: Date.now() + (m.is_typing ? 5000 : 0) } };
          force((n) => n + 1);
          break;
        case "presence":
          presenceRef.current = { ...presenceRef.current, [m.account_id]: { online: !!m.online, lastSeen: m.last_seen ? ms(m.last_seen) : null } };
          force((n) => n + 1);
          break;
        case "presence_snapshot":
          (m.online || []).forEach((id: string) => { presenceRef.current[id] = { online: true, lastSeen: null }; });
          force((n) => n + 1);
          break;
      }
    });
    return off;
  }, [markRead, patchChat]);

  // Expire stale typing indicators.
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      const any = Object.values(typingRef.current).some((x) => x.exp > now);
      if (any) force((n) => n + 1);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <Ctx.Provider value={{ chats, myId, activeChatId, setActiveChatId, typingAccount, presenceFor, sendMessage, markRead, sendTyping, refreshChats }}>
      {children}
    </Ctx.Provider>
  );
}

export function useChatRealtime() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChatRealtime must be used within ChatRealtimeProvider");
  return ctx;
}
