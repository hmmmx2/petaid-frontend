import s from "@/app/(app)/dashboard.module.css";
import type { LearningActivity } from "@/lib/types";

const W = 520;
const H = 96;

function pointsToPath(values: number[]): string {
  if (values.length === 0) return "";
  const max = 100;
  const step = W / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = H - 10 - (v / max) * (H - 20);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function ActivityChart({ activity }: { activity: LearningActivity }) {
  const pts = activity.points;
  const quizPath = pointsToPath(pts.map((p) => p.quiz_score));
  // Normalize guidance counts onto same chart space
  const maxSessions = Math.max(1, ...pts.map((p) => p.guidance_sessions));
  const sessionPath = pointsToPath(
    pts.map((p) => Math.round((p.guidance_sessions / maxSessions) * 100)),
  );

  // Find peak quiz score for annotation
  const peakIdx = pts.reduce(
    (best, p, i) => (p.quiz_score > pts[best].quiz_score ? i : best),
    0,
  );
  const peakX = (peakIdx / Math.max(pts.length - 1, 1)) * W;
  const peakY = H - 10 - (pts[peakIdx]?.quiz_score / 100) * (H - 20);

  return (
    <div className={s.chartCard}>
      <div className={s.ccHeader}>
        <div>
          <div className={s.ccTitle}>Learning Activity</div>
          <div className={s.ccSub}>Quizzes vs. guidance sessions accessed</div>
        </div>
        <div className={s.ccStat}>
          <div className={s.ccBig}>{activity.avg_score_trend_pct}%</div>
          <div className={s.ccSmall}>avg. score trend</div>
        </div>
      </div>
      <div style={{ height: H }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <path d={quizPath} fill="none" stroke="#1D9E75" strokeWidth="2" />
          <path
            d={sessionPath}
            fill="none"
            stroke="#EC6B52"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {Number.isFinite(peakX) && Number.isFinite(peakY) && (
            <>
              <circle cx={peakX} cy={peakY} r="4" fill="#1D9E75" />
              <rect
                x={Math.max(0, Math.min(W - 96, peakX - 48))}
                y={Math.max(0, peakY - 22)}
                width="96"
                height="17"
                rx="4"
                fill="#F4F0E0"
              />
              <text
                x={Math.max(48, Math.min(W - 48, peakX))}
                y={Math.max(12, peakY - 10)}
                textAnchor="middle"
                fontSize="10"
                fill="#515c67"
              >
                {activity.peak_label}
              </text>
            </>
          )}
        </svg>
      </div>
      <div className={s.cLblRow}>
        {pts.map((p) => (
          <span key={p.label} className={s.cLbl}>
            {p.label}
          </span>
        ))}
      </div>
      <div className={s.legend}>
        <div className={s.legItem}>
          <div className={s.legDot} style={{ background: "#1D9E75" }} />
          Quiz scores
        </div>
        <div className={s.legItem}>
          <div className={s.legDot} style={{ background: "#EC6B52", height: 2, margin: "1.5px 0" }} />
          Guidance sessions
        </div>
      </div>
    </div>
  );
}
