import s from "@/app/dashboard/dashboard.module.css";
import type { ResourceItem } from "@/lib/types";
import { FileIcon, ImagesIcon, PlayIcon } from "./icons";

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  watched: { bg: "#E1F5EE", fg: "#085041", label: "Watched" },
  in_progress: { bg: "#FDECEA", fg: "#b84c36", label: "In Progress" },
  new: { bg: "#FAEEDA", fg: "#633806", label: "New" },
};

function KindIcon({ kind }: { kind: string }) {
  if (kind === "video")
    return (
      <div className={s.resIc} style={{ background: "#E1F5EE" }}>
        <PlayIcon />
      </div>
    );
  if (kind === "pdf")
    return (
      <div className={s.resIc} style={{ background: "#FDECEA" }}>
        <FileIcon />
      </div>
    );
  return (
    <div className={s.resIc} style={{ background: "#FAEEDA" }}>
      <ImagesIcon />
    </div>
  );
}

export function ResourcesCard({ resources }: { resources: ResourceItem[] }) {
  return (
    <div className={s.resCard}>
      <div className={s.resCardHead}>
        <span>Connected Resources</span>
        <span style={{ fontSize: 11, color: "var(--t3)" }}>{resources.length} active</span>
      </div>
      {resources.map((r) => {
        const style = STATUS_STYLE[r.status] || STATUS_STYLE.new;
        return (
          <div key={r.id} className={s.resRow}>
            <KindIcon kind={r.kind} />
            <div className={s.resName}>{r.title}</div>
            <div className={s.resBadge} style={{ background: style.bg, color: style.fg }}>
              {style.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
