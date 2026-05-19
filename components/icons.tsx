type IconProps = { size?: number; color?: string; className?: string };

const base = (size = 13, color = "currentColor") => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function GridIcon(p: IconProps) {
  return (
    <svg {...base(p.size, p.color)}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function PetIcon(p: IconProps) {
  return (
    <svg {...base(p.size, p.color)}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BookIcon(p: IconProps) {
  return (
    <svg {...base(p.size, p.color)}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function QuizIcon(p: IconProps) {
  return (
    <svg {...base(p.size, p.color)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" strokeWidth={2} />
    </svg>
  );
}

export function ChatIcon(p: IconProps) {
  return (
    <svg {...base(p.size, p.color)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function InfoIcon(p: IconProps) {
  return (
    <svg {...base(p.size, p.color)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2} />
    </svg>
  );
}

export function StarIcon(p: IconProps) {
  return (
    <svg {...base(p.size, p.color)}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function GiftIcon(p: IconProps) {
  return (
    <svg {...base(p.size, p.color)}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="1" y="7" width="22" height="5" rx="1" />
      <line x1="12" y1="22" x2="12" y2="7" />
    </svg>
  );
}

export function AlertIcon({ size = 13, color = "#F4F0E0" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        fill="rgba(244,240,224,0.2)"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ size = 11, color = "#515c67" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function SearchIcon({ size = 12, color = "#8a9099" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ size = 14, color = "#515c67" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayIcon({ size = 12, color = "#1D9E75" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function FileIcon({ size = 12, color = "#EC6B52" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ImagesIcon({ size = 12, color = "#BA7517" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
