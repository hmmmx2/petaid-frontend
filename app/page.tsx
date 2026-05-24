"use client";

/* Root — 1:1 port of views/99-app.jsx state machine.
   Picks Welcome / Guest / PetOwner / VetExpert from the controller snapshot. */
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { PetAidProvider, usePetAid } from "@/lib/petaid";
import { ChatRealtimeProvider } from "@/lib/chatRealtime";
import { ToastProvider } from "@/components/ui";
import { Home } from "@/components/views/Home";
import { Welcome } from "@/components/views/Welcome";
import { Guest } from "@/components/views/Guest";
import { PetOwner } from "@/components/views/PetOwner";
import { VetExpert } from "@/components/views/VetExpert";

// Logged-out visitors land on Home, then choose sign-in/register (auth) or the
// public guest library. "authMode" seeds the Welcome screen's initial tab.
type View = "home" | "auth" | "guest";

function AppInner() {
  const { snapshot, loading } = usePetAid();
  const [view, setView] = useState<View>("home");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  if (loading || !snapshot) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 14 }}>Loading PetAid…</div>;
  }

  if (!snapshot.account) {
    if (view === "guest") {
      return <Guest onSignIn={() => { setAuthMode("login"); setView("auth"); }} onHome={() => setView("home")} />;
    }
    if (view === "auth") {
      return (
        <Welcome
          initialMode={authMode}
          onAuthed={() => setView("home")}
          onHome={() => setView("home")}
          onGuest={() => setView("guest")}
        />
      );
    }
    return (
      <Home
        onSignIn={() => { setAuthMode("login"); setView("auth"); }}
        onRegister={() => { setAuthMode("register"); setView("auth"); }}
        onGuest={() => setView("guest")}
      />
    );
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
          <ChatRealtimeProvider>
            <AppInner />
          </ChatRealtimeProvider>
        </PetAidProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
