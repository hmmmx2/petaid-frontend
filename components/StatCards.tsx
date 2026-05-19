import s from "@/app/dashboard/dashboard.module.css";
import type { StatCards as StatCardsT } from "@/lib/types";

export function StatCards({ stats }: { stats: StatCardsT }) {
  return (
    <div className={s.statRow}>
      <div className={s.sc} style={{ background: "#E1F5EE" }}>
        <div className={s.scIcon} style={{ background: "rgba(29,158,117,0.15)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <polyline
              points="9 11 12 14 22 4"
              stroke="#1D9E75"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
              stroke="#1D9E75"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={s.scLbl} style={{ color: "#0F6E56" }}>QUIZ AVG. SCORE</div>
        <div className={s.scNum} style={{ color: "#085041" }}>{stats.quiz_avg_score}%</div>
        <div className={s.scSub} style={{ color: "#0F6E56" }}>Avg. Completed</div>
      </div>

      <div className={s.sc} style={{ background: "#FDECEA" }}>
        <div className={s.scIcon} style={{ background: "rgba(236,107,82,0.12)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#EC6B52" strokeWidth="2" />
            <polyline points="12 6 12 12 16 14" stroke="#EC6B52" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className={s.scLbl} style={{ color: "#b84c36" }}>GUIDANCE SESSIONS</div>
        <div className={s.scNum} style={{ color: "#7a2918" }}>
          {stats.guidance_sessions_this_month}
        </div>
        <div className={s.scSub} style={{ color: "#b84c36" }}>This month</div>
      </div>

      <div className={s.sc} style={{ background: "#F5F5F4" }}>
        <div className={s.scIcon} style={{ background: "rgba(83,74,183,0.1)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="#534AB7"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={s.scLbl} style={{ color: "#3C3489" }}>PREPAREDNESS</div>
        <div className={s.scNum} style={{ color: "#26215C" }}>{stats.preparedness_pct}%</div>
        <div className={s.scSub} style={{ color: "#3C3489" }}>Overall readiness</div>
      </div>
    </div>
  );
}
