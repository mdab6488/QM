"use client";

import { useStore } from "@/lib/store";
import { fmtMoney } from "@/lib/utils";
import { computeKPIs } from "@/lib/stats";
import { useMemo } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export function Topbar() {
  const hydrated = useStore((s) => s.hydrated);
  const trades = useStore((s) => s.trades);
  const settings = useStore((s) => s.settings);

  const { balance, todayPnl, todayCount, tilt } = useMemo(() => {
    const kpis = computeKPIs(trades, settings.startingBalance);
    const today = new Date().toISOString().slice(0, 10);
    const todays = trades.filter((t) => t.date.slice(0, 10) === today);
    const dayPnl = todays.reduce((a, t) => a + t.pnl, 0);
    const count = todays.length;
    return {
      balance: settings.startingBalance + kpis.netPnl,
      todayPnl: dayPnl,
      todayCount: count,
      tilt: dayPnl <= -settings.dailyLossLimit || count >= settings.maxTradesPerDay,
    };
  }, [trades, settings]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-bg/80 backdrop-blur px-4 md:px-6 h-14">
      <div className="flex items-center gap-2">
        <span className="md:hidden font-semibold">QM Cockpit</span>
      </div>
      {hydrated && (
        <div className="flex items-center gap-3 md:gap-5 text-sm">
          {tilt ? (
            <span className="chip bg-loss/15 text-loss">
              <ShieldAlert size={14} /> Stop trading — limit hit
            </span>
          ) : (
            <span className="chip bg-win/15 text-win">
              <ShieldCheck size={14} /> Clear to trade
            </span>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-muted leading-none">Today</div>
            <div
              className={`tabular-nums font-medium ${
                todayPnl > 0 ? "text-win" : todayPnl < 0 ? "text-loss" : "text-text"
              }`}
            >
              {fmtMoney(todayPnl, settings.currency)}
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
