"use client";

import { useCallback, useEffect, useState } from "react";
import s from "@/app/(app)/dashboard.module.css";
import { PetOwnerDashboard } from "@/components/PetOwnerDashboard";
import { VeterinaryDashboard } from "@/components/VeterinaryDashboard";
import { ApiError, api } from "@/lib/api";
import type { DashboardResponse } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => {
        if (!(err instanceof ApiError) || err.status !== 401) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className={s.loading}>{error}</div>;
  if (!data) return <div className={s.loading}>Loading dashboard…</div>;

  if (data.role === "veterinary_expert") {
    return <VeterinaryDashboard user={data.user} panels={data.panels} onChanged={load} />;
  }
  return <PetOwnerDashboard user={data.user} panels={data.panels} />;
}
