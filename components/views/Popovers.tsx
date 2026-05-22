"use client";

/* Notifications + Settings popovers — 1:1 port of views/05-popovers.jsx.
   Notifications are derived from the snapshot (SRS §2.4.1 discarded the
   Notification class), read-state persisted in localStorage. */
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Icon, maskEmail, relTime } from "@/components/ui";
import type { PetOwnerPanels, Snapshot, VetPanels } from "@/lib/petaid";

type NotifAction = { type: string; payload?: string; section?: string };
type Notif = {
  id: string;
  text: ReactNode;
  actor: string;
  timestamp: number;
  tone: "sage" | "coral" | "gold";
  icon: string;
  action?: NotifAction;
};

function deriveNotifications(snapshot: Snapshot): Notif[] {
  const acc = snapshot.account;
  if (!acc || !snapshot.dashboard) return [];
  const items: Notif[] = [];

  if (acc.role === "pet_owner") {
    const p = snapshot.dashboard.panels as PetOwnerPanels;
    p.inquiries.forEach((i) => {
      if (i.status === "responded" && i.respondedAt) {
        items.push({
          id: `inq-resp-${i.id}`, actor: "Dr. Kavitha", tone: "sage", icon: "mail",
          timestamp: i.respondedAt, action: { type: "open_inquiry", payload: i.id },
          text: <>A vet responded to your inquiry: <strong>&quot;{i.question.slice(0, 48)}{i.question.length > 48 ? "…" : ""}&quot;</strong></>,
        });
      }
    });
    p.chats.forEach((c) => {
      const last = c.messages[c.messages.length - 1];
      if (last && last.senderId !== acc.id) {
        items.push({
          id: `chat-msg-${c.id}-${last.id}`, actor: "Vet team", tone: "coral", icon: "chat",
          timestamp: last.at, action: { type: "open_chat", payload: c.id },
          text: <>New message in your chat session: <span className="muted">&quot;{last.text.slice(0, 64)}&quot;</span></>,
        });
      }
    });
    p.donations.forEach((d) => {
      if (d.status === "succeeded") {
        items.push({
          id: `don-${d.id}`, actor: "PetAid", tone: "gold", icon: "gift", timestamp: d.at || Date.now(),
          text: <>Thank you for your <strong>${d.amount.toFixed(2)}</strong> donation.</>,
        });
      }
    });
  } else {
    const p = snapshot.dashboard.panels as VetPanels;
    p.inquiriesByStatus.pending.forEach((i) => {
      items.push({
        id: `inq-pending-${i.id}`, actor: "Pet owner", tone: "coral", icon: "mail",
        timestamp: i.createdAt, action: { type: "open_inquiry_vet", payload: i.id },
        text: <>New inquiry submitted: <strong>&quot;{i.question.slice(0, 56)}&quot;</strong></>,
      });
    });
    p.activeChats.filter((c) => c.status === "initiated").forEach((c) => {
      items.push({
        id: `chat-wait-${c.id}`, actor: "Pet owner", tone: "coral", icon: "chat",
        timestamp: c.startedAt, action: { type: "open_chat_vet", payload: c.id },
        text: <>A pet owner is waiting in chat. <strong>Join the conversation.</strong></>,
      });
    });
    p.flaggedFeedback.forEach((f) => {
      items.push({
        id: `fb-flag-${f.id}`, actor: "Pet owner", tone: "gold", icon: "star", timestamp: f.createdAt,
        text: <>Content flagged for review: <strong>{f.rating}★</strong> — &quot;{(f.comment || "No comment").slice(0, 56)}&quot;</>,
      });
    });
  }
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

/* read-state */
const READ_KEY = "petaid:notif:read";
const getRead = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const setRead = (s: Set<string>) => localStorage.setItem(READ_KEY, JSON.stringify([...s]));

function bucketize(items: Notif[]) {
  const now = Date.now();
  const today: Notif[] = [], week: Notif[] = [], earlier: Notif[] = [];
  items.forEach((i) => {
    const ageH = (now - i.timestamp) / 3600000;
    if (ageH < 24) today.push(i);
    else if (ageH < 168) week.push(i);
    else earlier.push(i);
  });
  return [
    { title: "Today", items: today },
    { title: "This week", items: week },
    { title: "Earlier", items: earlier },
  ].filter((g) => g.items.length > 0);
}

function NotificationsPopover({
  snapshot, onClose, onAction, readIds, markRead, markAllRead,
}: {
  snapshot: Snapshot; onClose: () => void; onAction?: (a: NotifAction) => void;
  readIds: Set<string>; markRead: (id: string) => void; markAllRead: (items: Notif[]) => void;
}) {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(t) && !t.closest('[data-popover-trigger="notifications"]')) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const items = useMemo(() => deriveNotifications(snapshot), [snapshot]);
  const filtered = tab === "unread" ? items.filter((i) => !readIds.has(i.id)) : items;
  const groups = bucketize(filtered);
  const unread = items.filter((i) => !readIds.has(i.id)).length;

  const click = (item: Notif) => {
    markRead(item.id);
    if (item.action) onAction?.(item.action);
    onClose();
  };

  return (
    <div className="popover" ref={ref} role="dialog" aria-label="Notifications">
      <div className="popover-head">
        <h3>Notifications {unread > 0 && <span style={{ color: "var(--accent)", fontWeight: 600 }}>· {unread}</span>}</h3>
        {unread > 0 && <button className="link" onClick={() => markAllRead(items)}>Mark all read</button>}
      </div>
      <div className="popover-tabs" role="tablist">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>All</button>
        <button className={tab === "unread" ? "active" : ""} onClick={() => setTab("unread")}>
          Unread{unread > 0 ? ` · ${unread}` : ""}
        </button>
      </div>
      <div className="popover-body">
        {filtered.length === 0 && (
          <div className="popover-empty">
            <div className="icon-circle"><Icon name="bell" size={20} /></div>
            <strong>You&apos;re all caught up</strong>
            <p>New activity from your vet team and the community will land here.</p>
          </div>
        )}
        {groups.map((group) => (
          <div key={group.title}>
            <div className="notif-group">{group.title}</div>
            {group.items.map((item) => (
              <div key={item.id} className={`notif-item ${readIds.has(item.id) ? "" : "unread"}`} onClick={() => click(item)} role="button" tabIndex={0}>
                <div className={`notif-icon ${item.tone}`}><Icon name={item.icon} size={16} /></div>
                <div className="notif-body">
                  <div className="notif-text">{item.text}</div>
                  <div className="notif-time">{relTime(item.timestamp)} · {item.actor}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPopover({
  snapshot, onClose, onAction, onSignOut,
}: {
  snapshot: Snapshot; onClose: () => void; onAction?: (a: NotifAction) => void; onSignOut: () => void;
}) {
  const acc = snapshot.account!;
  const ref = useRef<HTMLDivElement>(null);
  const [soundsOn, setSoundsOn] = useState(true);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(t) && !t.closest('[data-popover-trigger="settings"]')) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const initials = acc.name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="popover" ref={ref} role="dialog" aria-label="Settings">
      <div className="settings-account">
        <div className="avatar">{initials}</div>
        <div className="meta">
          <div className="name">{acc.name}</div>
          <div className="email">{maskEmail(acc.email || `${acc.name.split(" ")[0].toLowerCase()}@petaid.com`)}</div>
        </div>
        <button className="view-profile" onClick={() => { onAction?.({ type: "open_settings", section: "profile" }); onClose(); }}>View</button>
      </div>
      <div className="popover-body">
        <div className="settings-section">
          <button className="settings-item" onClick={() => { onAction?.({ type: "open_settings", section: "profile" }); onClose(); }}>
            <div className="icon-circle"><Icon name="settings" size={15} /></div>
            <div className="label">Settings &amp; privacy<small>Profile, security, notifications, data</small></div>
            <Icon name="chevron" size={14} className="chevron" />
          </button>
        </div>
        <div className="settings-section">
          <div className="settings-section-title">Quick preferences</div>
          <button className="settings-item" onClick={() => setSoundsOn((v) => !v)}>
            <div className="icon-circle"><Icon name="bell" size={15} /></div>
            <div className="label">Notification sounds<small>Play a chime for new messages</small></div>
            <div className={`settings-switch ${soundsOn ? "on" : ""}`} />
          </button>
        </div>
        <div className="settings-section">
          <button className="settings-item" onClick={() => { onAction?.({ type: "open_help" }); onClose(); }}>
            <div className="icon-circle"><Icon name="inquiry" size={15} /></div>
            <div className="label">Help center</div>
            <Icon name="chevron" size={14} className="chevron" />
          </button>
          <button className="settings-item" onClick={() => { onAction?.({ type: "open_settings", section: "about" }); onClose(); }}>
            <div className="icon-circle"><Icon name="book" size={15} /></div>
            <div className="label">About PetAid<small>Version 1.0.0</small></div>
            <Icon name="chevron" size={14} className="chevron" />
          </button>
        </div>
        <div className="settings-section">
          <button className="settings-item danger" onClick={() => { if (window.confirm("Sign out of PetAid?")) { onSignOut(); onClose(); } }}>
            <div className="icon-circle"><Icon name="sign_out" size={15} /></div>
            <div className="label">Sign out</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export function TopbarActions({
  snapshot, onAction, onSignOut,
}: {
  snapshot: Snapshot; onAction?: (a: NotifAction) => void; onSignOut: () => void;
}) {
  const [open, setOpen] = useState<"notifications" | "settings" | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => getRead());
  const items = useMemo(() => deriveNotifications(snapshot), [snapshot]);
  const unread = items.filter((i) => !readIds.has(i.id)).length;

  const markRead = (id: string) => {
    const next = new Set(getRead());
    next.add(id);
    setRead(next);
    setReadIds(next);
  };
  const markAllRead = (list: Notif[]) => {
    const next = new Set(getRead());
    list.forEach((i) => next.add(i.id));
    setRead(next);
    setReadIds(next);
  };

  return (
    <>
      <div className="popover-anchor">
        <button className="icon-btn" data-popover-trigger="notifications" onClick={() => setOpen(open === "notifications" ? null : "notifications")} aria-label="Notifications">
          <Icon name="bell" size={15} />
          {unread > 0 && <span className="badge">{unread > 9 ? "9+" : unread}</span>}
        </button>
        {open === "notifications" && (
          <NotificationsPopover snapshot={snapshot} readIds={readIds} markRead={markRead} markAllRead={markAllRead} onClose={() => setOpen(null)} onAction={onAction} />
        )}
      </div>
      <div className="popover-anchor">
        <button className="icon-btn" data-popover-trigger="settings" onClick={() => setOpen(open === "settings" ? null : "settings")} aria-label="Settings">
          <Icon name="settings" size={15} />
        </button>
        {open === "settings" && (
          <SettingsPopover snapshot={snapshot} onClose={() => setOpen(null)} onAction={onAction} onSignOut={onSignOut} />
        )}
      </div>
    </>
  );
}
