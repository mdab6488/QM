"use client";

import { useState } from "react";
import {
  ASSET_CLASSES,
  EMOTIONS,
  MISTAKE_TAGS,
  STRATEGY_TAGS,
  Trade,
} from "@/lib/types";
import { Field, Input, Select, Textarea } from "./ui";
import { cn } from "@/lib/utils";

type Draft = Omit<Trade, "id">;

function emptyDraft(): Draft {
  return {
    date: new Date().toISOString().slice(0, 16),
    asset: "EUR/USD",
    assetClass: "Forex",
    direction: "CALL",
    timeframe: "1m",
    investment: 100,
    payoutPct: 85,
    outcome: "WIN",
    pnl: 0,
    followedPlan: true,
    strategy: "Trend follow",
    emotionBefore: "Focused",
    emotionAfter: "Confident",
    confidence: 3,
    mistakes: [],
    notes: "",
    tags: [],
  };
}

/** Auto-compute pnl from outcome / investment / payout. */
function computePnl(d: Draft): number {
  if (d.outcome === "WIN") return +(d.investment * (d.payoutPct / 100)).toFixed(2);
  if (d.outcome === "LOSS") return -d.investment;
  return 0;
}

export function TradeForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Trade;
  onSubmit: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Draft>(() => {
    if (initial) {
      const { id, ...rest } = initial;
      return { ...rest, date: initial.date.slice(0, 16) };
    }
    return emptyDraft();
  });
  const [autoPnl, setAutoPnl] = useState(!initial);

  const set = (patch: Partial<Draft>) => setD((p) => ({ ...p, ...patch }));

  const toggleMistake = (m: string) =>
    set({
      mistakes: d.mistakes.includes(m)
        ? d.mistakes.filter((x) => x !== m)
        : [...d.mistakes, m],
    });

  const submit = () => {
    const pnl = autoPnl ? computePnl(d) : Number(d.pnl);
    onSubmit({
      ...d,
      date: new Date(d.date).toISOString(),
      investment: Number(d.investment),
      payoutPct: Number(d.payoutPct),
      confidence: Number(d.confidence),
      pnl,
    });
  };

  const previewPnl = autoPnl ? computePnl(d) : Number(d.pnl);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date & time">
          <Input type="datetime-local" value={d.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
        <Field label="Asset">
          <Input value={d.asset} onChange={(e) => set({ asset: e.target.value })} placeholder="EUR/USD" />
        </Field>
        <Field label="Asset class">
          <Select
            value={d.assetClass}
            onChange={(e) => set({ assetClass: e.target.value as any })}
            options={ASSET_CLASSES.map((a) => ({ value: a, label: a }))}
          />
        </Field>
        <Field label="Timeframe">
          <Input value={d.timeframe} onChange={(e) => set({ timeframe: e.target.value })} placeholder="5m" />
        </Field>
        <Field label="Direction">
          <Select
            value={d.direction}
            onChange={(e) => set({ direction: e.target.value as any })}
            options={[
              { value: "CALL", label: "CALL (Up)" },
              { value: "PUT", label: "PUT (Down)" },
            ]}
          />
        </Field>
        <Field label="Outcome">
          <Select
            value={d.outcome}
            onChange={(e) => set({ outcome: e.target.value as any })}
            options={[
              { value: "WIN", label: "Win" },
              { value: "LOSS", label: "Loss" },
              { value: "DRAW", label: "Draw / Refund" },
            ]}
          />
        </Field>
        <Field label="Investment (stake)">
          <Input type="number" value={d.investment} onChange={(e) => set({ investment: +e.target.value })} />
        </Field>
        <Field label="Payout %">
          <Input type="number" value={d.payoutPct} onChange={(e) => set({ payoutPct: +e.target.value })} />
        </Field>
      </div>

      <div className="card p-3 bg-panel2/50 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={autoPnl} onChange={(e) => setAutoPnl(e.target.checked)} />
          Auto-calculate PnL from outcome & payout
        </label>
        {autoPnl ? (
          <span className={cn("font-semibold tabular-nums", previewPnl >= 0 ? "text-win" : "text-loss")}>
            PnL: {previewPnl >= 0 ? "+" : ""}
            {previewPnl}
          </span>
        ) : (
          <Input
            type="number"
            className="w-32"
            value={d.pnl}
            onChange={(e) => set({ pnl: +e.target.value })}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Strategy / setup">
          <Select
            value={d.strategy}
            onChange={(e) => set({ strategy: e.target.value })}
            options={STRATEGY_TAGS.map((s) => ({ value: s, label: s }))}
          />
        </Field>
        <Field label="Conviction (1-5)">
          <Input
            type="number"
            min={1}
            max={5}
            value={d.confidence}
            onChange={(e) => set({ confidence: +e.target.value })}
          />
        </Field>
        <Field label="Emotion before">
          <Select
            value={d.emotionBefore}
            onChange={(e) => set({ emotionBefore: e.target.value as any })}
            options={EMOTIONS.map((s) => ({ value: s, label: s }))}
          />
        </Field>
        <Field label="Emotion after">
          <Select
            value={d.emotionAfter}
            onChange={(e) => set({ emotionAfter: e.target.value as any })}
            options={EMOTIONS.map((s) => ({ value: s, label: s }))}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={d.followedPlan}
          onChange={(e) => set({ followedPlan: e.target.checked })}
        />
        I followed my trading plan on this trade
      </label>

      <div>
        <label className="label">Mistakes (tag what went wrong)</label>
        <div className="flex flex-wrap gap-2">
          {MISTAKE_TAGS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMistake(m)}
              className={cn(
                "chip border",
                d.mistakes.includes(m)
                  ? "bg-loss/15 text-loss border-loss/30"
                  : "border-border text-muted hover:text-text"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <Field label="Notes">
        <Textarea
          value={d.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="What did you see? Why did you take it? What will you do differently?"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={submit}>
          {initial ? "Save changes" : "Add trade"}
        </button>
      </div>
    </div>
  );
}
