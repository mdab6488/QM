"use client";

import { useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Hydrated } from "@/components/Hydrated";
import { Card, SectionTitle, Stat, Badge, EmptyState } from "@/components/ui";
import { EquityCurveChart, PnlBars } from "@/components/charts";
import { byDay, computeKPIs, equityCurve } from "@/lib/stats";
import { fmtMoney, fmtPct } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, AlertTriangle, Target, Activity } from "lucide-react";

export default function DashboardPage() {
  return (
    <Hydrated>
      <Dashboard />
    </Hydrated>
  );
}

function Dashboard() {
  const trades = useStore((s) => s.trades);
  const settings = useStore((s) => s.settings);
  const rules = useStore((s) => s.rules);
  const loadSeed = useStore((s) => s.loadSeed);

  const k = useMemo(
    () => computeKPIs(trades, settings.startingBalance),
    [trades, settings.startingBalance]
  );
  const eq = useMemo(
    () => equityCurve(trades, settings.startingBalance),
    [trades, settings.startingBalance]
  );
  const daily = useMemo(() => byDay(trades), [trades]);

  const today = new Date().toISOString().slice(0, 10);
  const todays = trades.filter((t) => t.date.slice(0, 10) === today);
  const todayPnl = todays.reduce((a, t) => a + t.pnl, 0);
  const lossLimitLeft = settings.dailyLossLimit + todayPnl;

  const insights = useMemo(() => buildInsights(trades, k), [trades, k]);

  if (!trades.length) {
    return (
      <div className="space-y-4">
        <SectionTitle title="Dashboard" subtitle="Your trading performance at a glance" />
        <EmptyState
          title="No trades yet"
          hint="Add your first trade in the Journal, or load sample data from your QX sessions to explore the cockpit."
        />
        <div className="flex gap-2">
          <Link href="/trades" className="btn-primary">
            Go to Journal
          </Link>
          <button className="btn-ghost" onClick={loadSeed}>
            Load sample QX data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title={`Welcome back, ${settings.traderName}`}
        subtitle="Performance, discipline and risk — at a glance"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Net P&L"
          value={fmtMoney(k.netPnl, settings.currency)}
          tone={k.netPnl >= 0 ? "win" : "loss"}
          hint={`${k.totalTrades} trades`}
        />
        <Stat
          label="Win rate"
          value={fmtPct(k.winRate, 0)}
          hint={`${k.wins}W / ${k.losses}L`}
          tone={k.winRate >= 50 ? "win" : "warn"}
        />
        <Stat
          label="Profit factor"
          value={k.profitFactor === Infinity ? "∞" : k.profitFactor.toFixed(2)}
          hint="gross win ÷ gross loss"
          tone={k.profitFactor >= 1 ? "win" : "loss"}
        />
        <Stat
          label="Discipline"
          value={`${k.disciplineScore}`}
          hint="process score /100"
          tone={k.disciplineScore >= 70 ? "win" : k.disciplineScore >= 40 ? "warn" : "loss"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Equity curve"
            subtitle={`Starting balance ${fmtMoney(settings.startingBalance, settings.currency)}`}
            right={
              <Badge tone={k.netPnl >= 0 ? "win" : "loss"}>
                <TrendingUp size={13} /> {fmtMoney(k.netPnl, settings.currency)}
              </Badge>
            }
          />
          <EquityCurveChart data={eq} currency={settings.currency} />
        </Card>

        <Card>
          <SectionTitle title="Today" subtitle="Risk guardrails" />
          <div className="space-y-3">
            <Stat
              label="Today's P&L"
              value={fmtMoney(todayPnl, settings.currency)}
              tone={todayPnl > 0 ? "win" : todayPnl < 0 ? "loss" : "default"}
              hint={`${todays.length}/${settings.maxTradesPerDay} trades used`}
            />
            <div className="card p-3 bg-panel2/40">
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Daily loss limit</span>
                <span className="tabular-nums">
                  {fmtMoney(Math.max(0, lossLimitLeft), settings.currency)} left
                </span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full ${lossLimitLeft <= 0 ? "bg-loss" : lossLimitLeft < settings.dailyLossLimit * 0.4 ? "bg-warn" : "bg-win"}`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (lossLimitLeft / settings.dailyLossLimit) * 100))}%`,
                  }}
                />
              </div>
              {lossLimitLeft <= 0 && (
                <p className="text-loss text-xs mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Limit hit. Stop trading today.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="card p-2.5 bg-panel2/40">
                <div className="text-[11px] text-muted">Current streak</div>
                <div className={`font-semibold ${k.currentStreak >= 0 ? "text-win" : "text-loss"}`}>
                  {k.currentStreak > 0 ? `${k.currentStreak}W` : k.currentStreak < 0 ? `${Math.abs(k.currentStreak)}L` : "—"}
                </div>
              </div>
              <div className="card p-2.5 bg-panel2/40">
                <div className="text-[11px] text-muted">Max drawdown</div>
                <div className="font-semibold text-loss">
                  {fmtMoney(-k.maxDrawdown, settings.currency)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <SectionTitle title="Daily P&L" subtitle="Green days vs red days" />
          <PnlBars data={daily} currency={settings.currency} />
        </Card>

        <Card>
          <SectionTitle title="Coaching insights" subtitle="Auto-detected from your data" />
          <div className="space-y-2.5">
            {insights.map((i, idx) => (
              <div key={idx} className="flex gap-2.5 text-sm">
                <span
                  className={`mt-0.5 ${i.tone === "good" ? "text-win" : i.tone === "bad" ? "text-loss" : "text-warn"}`}
                >
                  {i.tone === "good" ? <Target size={15} /> : <Activity size={15} />}
                </span>
                <span className="text-muted">{i.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Active rules" subtitle="Your trading commitments" />
        <div className="flex flex-wrap gap-2">
          {rules.filter((r) => r.active).map((r) => (
            <Badge key={r.id} tone="brand">
              {r.text}
            </Badge>
          ))}
          {rules.filter((r) => r.active).length === 0 && (
            <span className="text-sm text-muted">No rules set — add them in Psychology.</span>
          )}
        </div>
      </Card>
    </div>
  );
}

function buildInsights(trades: any[], k: ReturnType<typeof computeKPIs>) {
  const out: { text: string; tone: "good" | "bad" | "warn" }[] = [];
  if (!trades.length) return out;

  // Emotion-based
  const revenge = trades.filter((t) => t.emotionBefore === "Revenge");
  if (revenge.length) {
    const rPnl = revenge.reduce((a, t) => a + t.pnl, 0);
    out.push({
      text: `You took ${revenge.length} revenge trade(s) for ${rPnl >= 0 ? "+" : ""}${rPnl}. These rarely pay — name the trigger and walk away.`,
      tone: "bad",
    });
  }

  // Plan adherence vs result
  const planned = trades.filter((t) => t.followedPlan);
  const unplanned = trades.filter((t) => !t.followedPlan);
  if (planned.length && unplanned.length) {
    const pAvg = planned.reduce((a, t) => a + t.pnl, 0) / planned.length;
    const uAvg = unplanned.reduce((a, t) => a + t.pnl, 0) / unplanned.length;
    out.push({
      text: `On-plan trades average ${pAvg.toFixed(0)} vs ${uAvg.toFixed(0)} off-plan. Discipline is your edge.`,
      tone: pAvg > uAvg ? "good" : "warn",
    });
  }

  if (k.maxLossStreak >= 3) {
    out.push({
      text: `Your worst losing streak is ${k.maxLossStreak}. Set a hard stop after 2-3 losses to avoid the spiral.`,
      tone: "warn",
    });
  }

  if (k.profitFactor >= 1.3) {
    out.push({ text: `Profit factor ${k.profitFactor.toFixed(2)} — your winners outweigh losers. Keep size consistent.`, tone: "good" });
  } else if (k.totalTrades >= 5) {
    out.push({ text: `Profit factor ${k.profitFactor === Infinity ? "∞" : k.profitFactor.toFixed(2)} is below 1.3 — focus on cutting low-conviction trades.`, tone: "warn" });
  }

  return out.slice(0, 5);
}
