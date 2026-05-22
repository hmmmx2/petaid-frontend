import type { Metadata } from "next";
import "./petaid.css";

// Next.js App Router auto-detects app/icon.png + app/apple-icon.png for the
// favicon / apple-touch-icon.
export const metadata: Metadata = {
  title: {
    default: "PetAid",
    template: "%s · PetAid",
  },
  description: "First-aid guidance for the pets you love. Vet-reviewed emergency protocols, quizzes, and live veterinary support.",
  applicationName: "PetAid",
  openGraph: {
    title: "PetAid",
    description: "First-aid guidance for the pets you love.",
    type: "website",
    images: [{ url: "/petaid-logo.png", width: 536, height: 504, alt: "PetAid" }],
  },
  twitter: {
    card: "summary",
    title: "PetAid",
    description: "First-aid guidance for the pets you love.",
    images: ["/petaid-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Reference fonts — General Sans (fontshare), Instrument Serif +
            JetBrains Mono (Google), matching PetAid.html exactly. */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
