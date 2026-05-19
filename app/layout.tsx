import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PetAid",
  description: "Trusted pet first-aid and veterinary guidance, when seconds matter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
