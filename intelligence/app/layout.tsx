import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DRPA Intelligence | Company performance & evidence",
  description: "A private demonstration of departmental inputs, governed KPIs, evidence and bid development.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
