"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Hydrated } from "@/components/Hydrated";
import { Card, SectionTitle, Stat, EmptyState, Badge } from "@/components/ui";
import { GroupBars } from "@/components/charts";
import {
  byHourOfDay,
  byWeekday,
  computeKPIs,
  groupBy,
} from "@/lib/stats";
import { fmtMoney, fmtPct } from "@/lib/utils";

export default function AnalyticsPage() {
  return (
    <Hydrated>
      <Analytics />
    </Hydrated>
  );
}

function Analytics() {
  const trades = useStore((s) => s.trades);
  const settings = useStore((s) => s.settings);
  const cur = settings.currency;

  const k = useMemo(() => computeKPIs(trades, settings.startingBalance), [trades, settings.startingBalance]);
  const byAsset = useMemo(() => groupBy(trades, (t) => t.asset), [trades]);
  const byStrategy = useMemo(() => groupBy(trades, (t) => t.strategy), [trades]);
  const byClass = useMemo(() => groupBy(trades, (t) => t.assetClass), [trades]);
  const byEmotion = useMemo(() => groupBy(trades, (t) => t.emotionBefore), [trades]);
  const byHour = useMemo(() => byHourOfDay(trades), [trades]);
  const byDow = useMemo(() => byWeekday(trades), [trades]);
  const byDir = useMemo(() => groupBy(trades, (t) => t.direction), [trades]);

  if (!trades.length) {
    return (
      <div className="space-y-4">
        <SectionTitle title="Analytics" subtitle="Where your edge is — and where it leaks" />
        <EmptyState title="No data to analyse yet" hint="Log trades to unlock breakdowns." />
      </div>
    );
  }

  const best = byAsset[0];
  const worst = byAsset[byAsset.length - 1];
  const bestHour = [...byHour].sort((a, b) => b.pnl - a.pnl)[0];
  const worstEmotion = [...byEmotion].sort((a, b) => a.pnl - b.pnl)[0];

  return (
    <div className="space-y-5">
      <SectionTitle title="Analytics" subtitle="Where your edge is — and where it leaks" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Expectancy / trade" value={fmtMoney(k.expectancy, cur)} tone={k.expectancy >= 0 ? "win" : "loss"} />
        <Stat label="Avg win" value={fmtMoney(k.avgWin, cur)} tone="win" />
        <Stat label="Avg loss" value={fmtMoney(k.avgLoss, cur)} tone="loss" />
        <Stat label="Plan adherence" value={fmtPct(k.planAdherence, 0)} tone={k.planAdherence >= 70 ? "win" : "warn"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs text-muted">Most profitable asset</div>
          <div className="text-lg font-semibold mt-1">{best?.key}</div>
          <Badge tone="win">{fmtMoney(best?.pnl ?? 0, cur)}</Badge>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Biggest leak (asset)</div>
          <div className="text-lg font-semibold mt-1">{worst?.key}</div>
          <Badge tone={worst && worst.pnl < 0 ? "loss" : "default"}>{fmtMoney(worst?.pnl ?? 0, cur)}</Badge>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Costliest emotion</div>
          <div className="text-lg font-semibold mt-1">{worstEmotion?.key}</div>
          <Badge tone={worstEmotion && worstEmotion.pnl < 0 ? "loss" : "default"}>
            {fmtMoney(worstEmotion?.pnl ?? 0, cur)}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionTitle title="P&L by asset" subtitle="Net result per instrument" />
          <GroupBars data={byAsset} currency={cur} />
        </Card>
        <Card>
          <SectionTitle title="P&L by strategy" subtitle="Which setups actually work" />
          <GroupBars data={byStrategy} currency={cur} />
        </Card>
        <Card>
          <SectionTitle title="P&L by hour of day" subtitle={`Your sharpest window: ${bestHour?.key}`} />
          <GroupBars data={byHour} currency={cur} />
        </Card>
        <Card>
          <SectionTitle title="P&L by weekday" subtitle="When you trade best" />
          <GroupBars data={byDow} currency={cur} />
        </Card>
        <Card>
          <SectionTitle title="P&L by emotion (before entry)" subtitle="Mindset vs money" />
          <GroupBars data={byEmotion} currency={cur} />
        </Card>
        <Card>
          <SectionTitle title="P&L by asset class" subtitle="Forex vs crypto vs the rest" />
          <GroupBars data={byClass} currency={cur} />
        </Card>
      </div>

      <Card>
        <SectionTitle title="Win rate by direction" subtitle="CALL vs PUT bias" />
        <div className="grid grid-cols-2 gap-3">
          {byDir.map((d) => (
            <div key={d.key} className="card p-4 bg-panel2/40">
              <div className="flex justify-between items-center">
                <span className="font-medium">{d.key}</span>
                <Badge tone={d.pnl >= 0 ? "win" : "loss"}>{fmtMoney(d.pnl, cur)}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted">
                {d.trades} trades · {fmtPct(d.winRate, 0)} win rate
              </div>
              <div className="h-1.5 mt-2 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-brand" style={{ width: `${d.winRate}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
