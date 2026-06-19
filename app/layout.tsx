import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "QM Trading Cockpit",
  description:
    "Personal trading analysis, journaling, psychology and news cockpit for market-qx.trade",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-[1400px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
