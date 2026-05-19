"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import s from "./dashboard.module.css";
import { ActivityChart } from "@/components/ActivityChart";
import { ResourcesCard } from "@/components/ResourcesCard";
import { RightPanel } from "@/components/RightPanel";
import { Sidebar } from "@/components/Sidebar";
import { StatCards } from "@/components/StatCards";
import { Topbar } from "@/components/Topbar";
import { CalendarIcon } from "@/components/icons";
import { ApiError, fetchDashboard, getAccessToken } from "@/lib/api";
import type { DashboardResponse } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    fetchDashboard()
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      });
  }, [router]);

  if (error) return <div className={s.loading}>{error}</div>;
  if (!data) return <div className={s.loading}>Loading dashboard…</div>;

  return (
    <div className={s.dash}>
      <Topbar user={data.user} />
      <Sidebar user={data.user} />

      <main className={s.main}>
        <div className={s.mainTop}>
          <div>
            <div className={s.wTitle}>Welcome back, {data.user.full_name.split(" ")[0]}</div>
            <div className={s.wSub}>Your pets are depending on your knowledge</div>
          </div>
          <div className={s.rangePill}>
            <CalendarIcon />
            Last 30 days
          </div>
        </div>

        <div className={s.petsRow}>
          {data.pets.map((p) => (
            <div key={p.id} className={s.petPill}>
              <div className={s.petIcon} style={{ background: p.icon_bg }}>
                {p.icon_emoji}
              </div>
              <div>
                <div className={s.petName}>{p.name}</div>
                <div className={s.petType}>
                  {p.breed ?? p.species}
                  {p.age_years != null ? ` · ${p.age_years} yr` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>

        <StatCards stats={data.stats} />
        <ActivityChart activity={data.activity} />
        <ResourcesCard resources={data.resources} />
      </main>

      <RightPanel
        chats={data.chats}
        readiness={data.readiness}
        reminders={data.reminders}
      />
    </div>
  );
}
