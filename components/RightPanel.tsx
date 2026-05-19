import s from "@/app/(app)/dashboard.module.css";
import type { ChatThread, ReadinessItem, Reminder } from "@/lib/types";
import { CalendarIcon, FileIcon } from "./icons";

function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
  }
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatReminderTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

type Props = {
  chats: ChatThread[];
  readiness: ReadinessItem[];
  reminders: Reminder[];
};

export function RightPanel({ chats, readiness, reminders }: Props) {
  return (
    <aside className={s.rpanel}>
      <div>
        <div className={s.rpTitle}>
          Recent Chats & Inquiries
          <span className={s.rpAction}>See all →</span>
        </div>
        {chats.map((t) => (
          <div key={t.id} className={s.chatItem}>
            <div
              className={s.chatAvi}
              style={{ background: t.counterpart_bg, color: t.counterpart_fg }}
            >
              {t.counterpart_initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={s.chatName}>
                {t.counterpart_name}
                <span className={s.chatTime}>{formatChatTime(t.last_message_at)}</span>
              </div>
              <div className={s.chatPrev}>{t.last_preview}</div>
            </div>
            {t.unread && <div className={s.unread} />}
          </div>
        ))}
      </div>

      <div>
        <div className={s.rpTitle}>Knowledge Readiness</div>
        {readiness.map((r) => (
          <div key={r.category} className={s.knowItem}>
            <div className={s.knowHd}>
              <span className={s.knowLbl}>{r.category}</span>
              <span className={s.knowPct}>{r.score_pct}%</span>
            </div>
            <div className={s.knowBar}>
              <div
                className={s.knowFill}
                style={{ width: `${r.score_pct}%`, background: r.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className={s.rpTitle}>Upcoming Reminders</div>
        {reminders.map((rem) => (
          <div key={rem.id} className={s.reminderItem}>
            <div
              className={s.remIc}
              style={{
                background: rem.icon_color === "#1D9E75" ? "#E1F5EE" : "#FDECEA",
              }}
            >
              {rem.kind === "resource" ? (
                <FileIcon color={rem.icon_color} />
              ) : (
                <CalendarIcon color={rem.icon_color} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={s.chatName}>
                {rem.title}
                <span className={s.chatTime}>{formatReminderTime(rem.due_at)}</span>
              </div>
              <div className={s.chatPrev}>{rem.body}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
