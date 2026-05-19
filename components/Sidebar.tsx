"use client";

import { useRouter } from "next/navigation";
import s from "@/app/dashboard/dashboard.module.css";
import {
  AlertIcon,
  BookIcon,
  ChatIcon,
  GiftIcon,
  GridIcon,
  InfoIcon,
  PetIcon,
  QuizIcon,
  StarIcon,
} from "./icons";
import type { UserSummary } from "@/lib/types";
import { logout } from "@/lib/api";

type Props = { user: UserSummary };

export function Sidebar({ user }: Props) {
  const router = useRouter();

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className={s.sidebar}>
      <div className={s.profileCard}>
        <div className={s.aviRing}>{user.initials}</div>
        <div className={s.pName}>{user.full_name}</div>
        <div className={s.pRole}>{user.role}</div>
        <div className={s.pStats}>
          <div className={s.ps}>
            <div className={s.psN}>{user.pets_count}</div>
            <div className={s.psL}>Pets</div>
          </div>
          <div className={s.ps}>
            <div className={s.psN}>{user.quizzes_count}</div>
            <div className={s.psL}>Quizzes</div>
          </div>
          <div className={s.ps}>
            <div className={s.psN}>{user.chats_count}</div>
            <div className={s.psL}>Chats</div>
          </div>
        </div>
      </div>

      <button type="button" className={s.emergBtn}>
        <AlertIcon />
        <div>
          <div className={s.emergLbl}>Emergency First Aid</div>
          <div className={s.emergSub}>Select pet → guidance loads instantly</div>
        </div>
      </button>

      <div className={s.navSec}>MAIN</div>
      <div className={`${s.navItem} ${s.active}`}>
        <GridIcon />
        Dashboard
      </div>
      <div className={s.navItem}>
        <PetIcon />
        My Pets
      </div>
      <div className={s.navItem}>
        <BookIcon />
        Resources
      </div>
      <div className={s.navItem}>
        <QuizIcon />
        Take a Quiz
      </div>

      <div className={s.navSec}>SUPPORT</div>
      <div className={s.navItem}>
        <ChatIcon />
        Chat with Vet
      </div>
      <div className={s.navItem}>
        <InfoIcon />
        Submit Inquiry
      </div>
      <div className={s.navItem}>
        <StarIcon />
        Feedback
      </div>
      <div className={s.navItem}>
        <GiftIcon />
        Donate
      </div>

      <div style={{ marginTop: "auto", paddingTop: 14 }}>
        <button type="button" className={s.navItem} onClick={signOut} style={{ width: "100%" }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
