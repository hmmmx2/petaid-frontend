"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import s from "@/app/(app)/dashboard.module.css";
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
import { logout } from "@/lib/api";
import type { UserSummary } from "@/lib/types";

type NavLink = { href: string; label: string; icon: () => JSX.Element };

const PET_OWNER_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: () => <GridIcon /> },
  { href: "/first-aid", label: "First Aid", icon: () => <AlertIcon color="#1b1b1f" /> },
  { href: "/pets", label: "My Pets", icon: () => <PetIcon /> },
  { href: "/resources", label: "Resources", icon: () => <BookIcon /> },
  { href: "/quizzes", label: "Take a Quiz", icon: () => <QuizIcon /> },
];

const PET_OWNER_SUPPORT: NavLink[] = [
  { href: "/chats", label: "Chat with Vet", icon: () => <ChatIcon /> },
  { href: "/inquiries", label: "Submit Inquiry", icon: () => <InfoIcon /> },
  { href: "/feedback", label: "Feedback", icon: () => <StarIcon /> },
  { href: "/donations", label: "Donate", icon: () => <GiftIcon /> },
];

const VET_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: () => <GridIcon /> },
  { href: "/inquiries", label: "Inquiries", icon: () => <InfoIcon /> },
  { href: "/chats", label: "Active Chats", icon: () => <ChatIcon /> },
  { href: "/resources", label: "Resources", icon: () => <BookIcon /> },
  { href: "/feedback", label: "Feedback Review", icon: () => <StarIcon /> },
];

type Props = { user: UserSummary };

export function Sidebar({ user }: Props) {
  const router = useRouter();
  const path = usePathname() || "/dashboard";

  const isVet = user.role === "veterinary_expert";
  const main = isVet ? VET_LINKS : PET_OWNER_LINKS;
  const support = isVet ? [] : PET_OWNER_SUPPORT;

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className={s.sidebar}>
      <div className={s.profileCard}>
        <div className={s.aviRing}>{user.initials}</div>
        <div className={s.pName}>{user.full_name}</div>
        <div className={s.pRole}>{isVet ? "Veterinary Expert" : "Pet Owner"}</div>
      </div>

      {!isVet && (
        <Link href="/first-aid" className={s.emergBtn} style={{ textDecoration: "none" }}>
          <AlertIcon />
          <div>
            <div className={s.emergLbl}>Emergency First Aid</div>
            <div className={s.emergSub}>Select pet → guidance loads instantly</div>
          </div>
        </Link>
      )}

      <div className={s.navSec}>MAIN</div>
      {main.map((link) => {
        const active = path === link.href || path.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${s.navItem} ${active ? s.active : ""}`}
            style={{ textDecoration: "none" }}
          >
            {link.icon()}
            {link.label}
          </Link>
        );
      })}

      {support.length > 0 && (
        <>
          <div className={s.navSec}>SUPPORT</div>
          {support.map((link) => {
            const active = path === link.href || path.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${s.navItem} ${active ? s.active : ""}`}
                style={{ textDecoration: "none" }}
              >
                {link.icon()}
                {link.label}
              </Link>
            );
          })}
        </>
      )}

      <div style={{ marginTop: "auto", paddingTop: 14 }}>
        <button
          type="button"
          className={s.navItem}
          onClick={signOut}
          style={{ width: "100%" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
