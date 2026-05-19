import s from "@/app/dashboard/dashboard.module.css";
import { BellIcon, SearchIcon } from "./icons";
import type { UserSummary } from "@/lib/types";

export function Topbar({ user }: { user: UserSummary }) {
  return (
    <header className={s.topbar}>
      <div className={s.logoWrap}>
        <div className={s.logoImg} aria-hidden>
          🐾
        </div>
        <div>
          <div className={s.logoText}>PetAid</div>
          <div className={s.logoSub}>First-aid · always with you</div>
        </div>
      </div>
      <div className={s.searchBar}>
        <SearchIcon />
        <span>Search resources, quizzes, vets…</span>
      </div>
      <div className={s.topbarRight}>
        <div className={s.notifWrap}>
          <BellIcon />
          <span className={s.notifDot} />
        </div>
        <div className={s.userChip}>
          <div className={s.userAvi}>{user.initials}</div>
          <div className={s.userName}>{user.full_name.split(" ")[0]}</div>
        </div>
      </div>
    </header>
  );
}
