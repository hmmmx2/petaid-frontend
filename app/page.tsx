"use client";

/* Root — 1:1 port of views/99-app.jsx state machine.
   Picks Welcome / Guest / PetOwner / VetExpert from the controller snapshot. */
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { PetAidProvider, usePetAid } from "@/lib/petaid";
import { ToastProvider } from "@/components/ui";
import { Welcome } from "@/components/views/Welcome";
import { Guest } from "@/components/views/Guest";
import { PetOwner } from "@/components/views/PetOwner";
import { VetExpert } from "@/components/views/VetExpert";

function AppInner() {
  const { snapshot, loading } = usePetAid();
  const [guestMode, setGuestMode] = useState(false);

  if (loading || !snapshot) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 14 }}>Loading PetAid…</div>;
  }

  if (guestMode && !snapshot.account) {
    return <Guest onSignIn={() => setGuestMode(false)} />;
  }

  if (!snapshot.account) {
    return <Welcome onAuthed={() => setGuestMode(false)} onGuest={() => setGuestMode(true)} />;
  }

  return snapshot.role === "vet_expert"
    ? <VetExpert snapshot={snapshot} />
    : <PetOwner snapshot={snapshot} />;
}

export default function Page() {
  return (
    <SessionProvider>
      <ToastProvider>
        <PetAidProvider>
          <AppInner />
        </PetAidProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
