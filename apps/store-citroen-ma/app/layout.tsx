import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Rihla — Citroën / Jeep / Peugeot",
  description: "AI concierge for automotive e-commerce.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
