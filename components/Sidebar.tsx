"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  Brain,
  Newspaper,
  Settings,
  CandlestickChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trades", label: "Money Management", icon: Wallet },
  { href: "/psychology", label: "Psychology", icon: Brain },
  { href: "/news", label: "News & Calendar", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border bg-panel/50 p-4">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <CandlestickChart className="text-brand" size={22} />
        <div>
          <div className="font-semibold leading-tight">QM Cockpit</div>
          <div className="text-[11px] text-muted leading-tight">market-qx.trade</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-brand/15 text-brand font-medium" : "text-muted hover:bg-panel2 hover:text-text"
              )}
            >
              <Icon size={18} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-border bg-panel/95 backdrop-blur px-1 py-1.5">
      {NAV.slice(0, 5).map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px]",
              active ? "text-brand" : "text-muted"
            )}
          >
            <Icon size={20} />
            {n.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
