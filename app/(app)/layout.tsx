"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./dashboard.module.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ApiError, api, getAccessToken } from "@/lib/api";
import type { UserSummary } from "@/lib/types";

/**
 * Shared layout for every authenticated page.
 *
 * It loads the current user once via /dashboard (the only endpoint that
 * returns the user summary), then renders the three-column shell. Pages
 * fill the centre via children; the right panel is rendered per-page via
 * a small slot pattern (each page can return its own React tree).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    api
      .dashboard()
      .then((d) => setUser(d.user))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load");
      });
  }, [router]);

  if (error) return <div className={s.loading}>{error}</div>;
  if (!user) return <div className={s.loading}>Loading…</div>;

  return (
    <div className={s.dash} style={{ gridTemplateColumns: "218px 1fr" }}>
      <Topbar user={user} />
      <Sidebar user={user} />
      <main className={s.main} style={{ gridColumn: "2 / span 1" }}>
        {children}
      </main>
    </div>
  );
}
