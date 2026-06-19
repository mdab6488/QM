"use client";

import { useStore } from "@/lib/store";
import { fmtMoney } from "@/lib/utils";
import { computeGroup, round2 } from "@/lib/stats";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { stopPersistence } from "@/lib/persistence";

export function Topbar() {
  const hydrated = useStore((s) => s.hydrated);
  const groups = useStore((s) => s.groups);
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);

  // Real balance = sum of every group's balance (deposits − withdrawals +
  // trading P&L). A brand-new user with no groups sees $0.00.
  const { balance, pnl } = useMemo(() => {
    let balance = 0;
    let pnl = 0;
    for (const g of groups) {
      const gs = computeGroup(g, sessions);
      balance += gs.balance;
      pnl += gs.sessionsNet;
    }
    return { balance: round2(balance), pnl: round2(pnl) };
  }, [groups, sessions]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-bg/80 backdrop-blur px-4 md:px-6 h-14">
      <div className="flex items-center gap-2">
        <span className="md:hidden font-semibold">QM</span>
      </div>
      <div className="flex items-center gap-3 md:gap-5 text-sm">
        {hydrated && (
          <>
            <div className="text-right">
              <div className="text-[11px] text-muted leading-none">Total P&L</div>
              <div
                className={`tabular-nums font-medium ${
                  pnl > 0 ? "text-win" : pnl < 0 ? "text-loss" : "text-text"
                }`}
              >
                {pnl >= 0 ? "+" : ""}
                {fmtMoney(pnl, settings.currency)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted leading-none">Balance</div>
              <div className="tabular-nums font-semibold">
                {fmtMoney(balance, settings.currency)}
              </div>
            </div>
          </>
        )}
        <AccountMenu />
      </div>
    </header>
  );
}

function AccountMenu() {
  const account = useStore((s) => s.account);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = async () => {
    try {
      await getSupabaseClient().auth.signOut();
    } catch {
      // ignore — we clear local state regardless
    }
    stopPersistence();
    useStore.getState().reset();
    router.replace("/login");
  };

  if (!account) return null;

  const initial = (account.name || account.email || "?").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-panel2 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {account.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={account.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand/20 text-brand grid place-items-center text-sm font-medium shrink-0">
            {initial}
          </div>
        )}
        {account.name && (
          <span className="hidden sm:block max-w-[120px] truncate font-medium">{account.name}</span>
        )}
        <ChevronDown
          size={15}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 card p-1.5 shadow-card z-50"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand/20 text-brand grid place-items-center text-sm font-medium shrink-0">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              {account.name && (
                <div className="text-sm font-medium leading-tight truncate">{account.name}</div>
              )}
              <div className="text-[11px] text-muted leading-tight truncate">{account.email}</div>
            </div>
          </div>
          <div className="my-1 border-t border-border" />
          <button
            onClick={signOut}
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-panel2 hover:text-text transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
