"use client";

import { useStore } from "@/lib/store";
import { fmtMoney } from "@/lib/utils";
import { computeGroup, round2 } from "@/lib/stats";
import { useMemo } from "react";

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
      {hydrated && (
        <div className="flex items-center gap-3 md:gap-5 text-sm">
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
        </div>
      )}
    </header>
  );
}
