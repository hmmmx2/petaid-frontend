"use client";

/* Shared icons + UI helpers — 1:1 port of the reference views/00-shared.jsx. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ---------- Icons ---------- */
const ICONS: Record<string, ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  paw: (<><circle cx="6" cy="10" r="2" /><circle cx="18" cy="10" r="2" /><circle cx="9" cy="5" r="1.8" /><circle cx="15" cy="5" r="1.8" /><path d="M8 17a4 4 0 1 1 8 0c0 2-1 4-4 4s-4-2-4-4Z" /></>),
  first_aid: (<><path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z" /><path d="M9 12h6M12 9v6" /></>),
  book: (<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" /><path d="M4 19.5V21h16" /></>),
  quiz: (<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 4 2L12 13v1" /><circle cx="12" cy="17" r="0.5" fill="currentColor" /></>),
  chat: (<><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 7 9-7" /></>),
  heart: (<><path d="M12 21s-7-4.5-9.5-9.5C.8 7.5 4 4 7.5 4c1.8 0 3.5 1 4.5 2.5C13 5 14.7 4 16.5 4 20 4 23.2 7.5 21.5 11.5 19 16.5 12 21 12 21Z" /></>),
  alert: (<><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></>),
  bell: (<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.16.66.42.88.74" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  sign_out: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>),
  arrow_right: (<><path d="M5 12h14M13 5l7 7-7 7" /></>),
  arrow_left: (<><path d="M19 12H5M11 5l-7 7 7 7" /></>),
  check: (<><path d="m5 12 5 5L20 7" /></>),
  x: (<><path d="M18 6 6 18M6 6l12 12" /></>),
  star: (<><path d="m12 2 3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9l3-7Z" /></>),
  send: (<><path d="m22 2-7 20-4-9-9-4 20-7Z" /></>),
  shield: (<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></>),
  flame: (<><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1 2.5-2.5 0-1-.5-1.5-1-2C13 12 14 11 14 9c0-2-2-3.5-2-5.5a4 4 0 0 0-2.5 3.5c0 1.5 1 2 1 3.5s-.5 2-1 2.5c-.5.5-1 1.5-1 2.5Z" /></>),
  droplet: (<><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7Z" /></>),
  bone: (<><path d="M17 10c.7-.7 2-.5 2-2 0-2-1.5-2.5-2.5-2.5C15 5.5 14.5 4 12.5 4 11 4 10 5 10 6.5c0 1-.5 1.5-1 1.5C8 8 7 9 7 10.5c0 1.5 1 2.5 2 2.5l3 3c1 1 2 2 3.5 2 1.5 0 2.5-1 2.5-2.5 0-1 0-1.5.5-2.5.5-1 2-1 2-2.5 0-1-.5-2.5-2.5-2.5" /></>),
  thermometer: (<><path d="M14 14.76V3a2 2 0 0 0-4 0v11.76a4 4 0 1 0 4 0Z" /></>),
  gift: (<><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" /></>),
  inquiry: (<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>),
  more: (<><circle cx="12" cy="6" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="18" r="1.2" fill="currentColor" /></>),
  menu: (<><path d="M3 6h18M3 12h18M3 18h18" /></>),
  upload: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></>),
  edit: (<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></>),
  chevron: (<><path d="m9 18 6-6-6-6" /></>),
  refresh: (<><path d="M21 12a9 9 0 1 1-3.51-7.13L21 8M21 3v5h-5" /></>),
};

export const Icon = ({
  name,
  size = 16,
  stroke = 1.7,
  className,
  style,
}: {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {ICONS[name] || null}
  </svg>
);

/* ---------- a11y helper ----------
   Spread onto a non-button element (a clickable card/row) so keyboard and
   screen-reader users can activate it with Enter/Space — satisfies WCAG
   2.1.1 (Keyboard). Use only for elements that genuinely act like buttons. */
export function clickable(onActivate: () => void, label?: string) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    onClick: onActivate,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
  };
}

/* ---------- BusyButton ----------
   Prevents button/double-submit spam: disables itself while its async onClick
   is in flight, so a user (or an impatient double-click) can't fire the same
   mutating request repeatedly. Pairs with server-side rate limits as the
   client-side half of anti-spam. */
export function BusyButton({
  onClick,
  children,
  className = "btn-primary",
  disabled = false,
  busyLabel,
  style,
  type = "button",
}: {
  onClick: () => unknown | Promise<unknown>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  busyLabel?: ReactNode;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const handle = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      await onClick();
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <button type={type} className={className} style={style} disabled={busy || disabled} onClick={handle}>
      {busy ? busyLabel ?? children : children}
    </button>
  );
}

/* ---------- Modal ---------- */
export const Modal = ({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      className="modal-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {onClose && (
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <Icon name="x" size={14} stroke={2} />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

/* ---------- Toasts ---------- */
type ToastVariant = "default" | "success" | "danger";
const ToastContext = createContext<{ push: (m: string, v?: ToastVariant) => void }>({
  push: () => {},
});

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<{ id: string; message: string; variant: ToastVariant }[]>([]);
  const push = useCallback((message: string, variant: ToastVariant = "default") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-area">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
export const useToast = () => useContext(ToastContext);

/* ---------- Field helpers ---------- */
export const Field = ({
  label,
  error,
  hint,
  children,
}: {
  label?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) => (
  <div className={`field ${error ? "error" : ""}`}>
    {label && <label>{label}</label>}
    {children}
    {hint && !error && <span className="hint">{hint}</span>}
    {error && <span className="err">{error}</span>}
  </div>
);

export const StarRow = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div className="star-row">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} className={n <= value ? "on" : ""} onClick={() => onChange(n)} aria-label={`${n} stars`}>
        <Icon name="star" size={20} stroke={1.5} />
      </button>
    ))}
  </div>
);

/* ---------- helpers ---------- */
export const relTime = (ts: number | string) => {
  const t = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
};

export const maskReference = (ref?: string | null) => {
  if (!ref || ref.length <= 8) return ref || "—";
  return `${ref.slice(0, 3)}${"•".repeat(Math.max(4, ref.length - 7))}${ref.slice(-4)}`;
};
export const maskEmail = (email?: string | null) => {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain || user.length <= 2) return email;
  return `${user.slice(0, 2)}${"•".repeat(Math.max(2, user.length - 2))}@${domain}`;
};
