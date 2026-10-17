import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Pregnancy Tracker",
  description: "Plan your pregnancy week by week: due date, to-dos, appointments, nursery, budget, names and more.",
  manifest: `${base}/manifest.webmanifest`,
  icons: { icon: `${base}/icons/icon-192.png`, apple: `${base}/icons/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "Pregnancy", statusBarStyle: "default" },
  robots: { index: false, follow: false },   // private app — keep it out of search engines
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#00a693" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
