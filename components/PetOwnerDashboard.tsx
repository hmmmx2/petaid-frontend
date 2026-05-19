"use client";

import Link from "next/link";
import s from "@/app/(app)/dashboard.module.css";
import type { PetOwnerPanels, UserSummary } from "@/lib/types";
import { ActivityChart } from "./ActivityChart";
import { CalendarIcon } from "./icons";
import { ResourcesCard } from "./ResourcesCard";
import { RightPanel } from "./RightPanel";
import { StatCards } from "./StatCards";

type Props = { user: UserSummary; panels: PetOwnerPanels };

export function PetOwnerDashboard({ user, panels }: Props) {
  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Welcome back, {user.display_name}</div>
          <div className={s.wSub}>Your pets are depending on your knowledge</div>
        </div>
        <div className={s.rangePill}>
          <CalendarIcon />
          Last 30 days
        </div>
      </div>

      <div className={s.petsRow}>
        {panels.pets.map((p) => (
          <div key={p.id} className={s.petPill}>
            <div className={s.petIcon} style={{ background: p.icon_bg }}>
              {p.icon_emoji}
            </div>
            <div>
              <div className={s.petName}>{p.name}</div>
              <div className={s.petType}>
                {p.breed ?? p.pet_type}
                {p.age_years != null ? ` · ${p.age_years} yr` : ""}
              </div>
            </div>
          </div>
        ))}
        {panels.pets.length === 0 && (
          <Link href="/pets" className={s.petPill} style={{ textDecoration: "none" }}>
            <div className={s.petIcon}>＋</div>
            <div>
              <div className={s.petName}>Add a pet</div>
              <div className={s.petType}>Tap to register</div>
            </div>
          </Link>
        )}
      </div>

      <StatCards stats={panels.stats} />
      <ActivityChart activity={panels.activity} />
      <ResourcesCard resources={panels.resources} />

      <div style={{ height: 18 }} />
      <aside style={{ background: "var(--card)", border: "0.5px solid var(--border2)", borderRadius: 12, padding: 14 }}>
        <RightPanelInline
          chats={panels.chats}
          readiness={panels.readiness}
          reminders={panels.reminders}
        />
      </aside>
    </>
  );
}

function RightPanelInline(props: Parameters<typeof RightPanel>[0]) {
  return <RightPanel {...props} />;
}
