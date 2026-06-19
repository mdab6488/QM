"use client";

import { useMemo, useState } from "react";
import { Card, SectionTitle, Stat, Badge } from "@/components/ui";
import { fmtMoney, fmtPct } from "@/lib/utils";
import {
  ShieldCheck,
  Ban,
  Hand,
  Target,
  Timer,
  NotebookPen,
  Calculator,
  TriangleAlert,
} from "lucide-react";

const RULES = [
  {
    n: "01",
    icon: ShieldCheck,
    title: "Risk small, survive long",
    body: "Risk only 1% to 2% of your account on a single trade. On a $1,000 balance, that's $10 to $20. Small bets mean a losing streak shrinks your account — it doesn't end it.",
  },
  {
    n: "02",
    icon: Ban,
    title: "Skip the Martingale trap",
    body: "Doubling your stake after a loss feels like a shortcut back to even. It isn't. A handful of losses in a row with this method can erase an account that took months to build.",
  },
  {
    n: "03",
    icon: Hand,
    title: "Set a daily stop-loss",
    body: 'Pick a number — 5% of your balance is a common one — and treat it as a wall. Hit it, and you\'re done trading for the day. No exceptions, no "just one more."',
  },
  {
    n: "04",
    icon: Target,
    title: "Set a daily profit target too",
    body: "Decide what a good day looks like before you start. Reach it, close the app. Staying longer doesn't earn you more — it just gives the market more chances to take it back.",
  },
  {
    n: "05",
    icon: Timer,
    title: "Pick a duration and stick to it",
    body: 'Choose expiry times that match your actual analysis, then leave them alone. The 1-minute "turbo" trade you open out of boredom is rarely the trade your strategy would have picked.',
  },
  {
    n: "06",
    icon: NotebookPen,
    title: "Write down every trade",
    body: "Asset, time, size, result, and how you felt going in. Review it weekly. Patterns in that log will teach you more than any single trade will.",
  },
];

const DAILY_STOP_PCT = 5;
const DANGER_DRAWDOWN = 30; // % drawdown that marks the danger zone

export default function Money2Page() {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Money Management"
        subtitle="Quotex / Binary Options — the trade that protects you is the one you don't take"
      />

      <Card className="bg-panel2/40">
        <p className="text-sm text-muted leading-relaxed">
          Binary options pay out in full or nothing at all, and the payout on a win is always
          less than the loss on a miss. That structure leans toward the broker before you place a
          single trade — which means the edges fully under your control are{" "}
          <span className="text-text font-medium">how much you stake</span> and{" "}
          <span className="text-text font-medium">how often you walk away</span>. Six rules, then
          a calculator that shows what a losing streak costs and how likely it is.
        </p>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RULES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.n} className="card p-5 bg-panel2/30 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-semibold tabular-nums text-brand/70">{r.n}</span>
                <Icon size={20} className="text-brand" />
              </div>
              <h3 className="font-semibold tracking-tight mb-1.5">{r.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{r.body}</p>
            </div>
          );
        })}
      </div>

      <Calc />

      <Card className="bg-panel2/20">
        <p className="text-xs text-muted leading-relaxed">
          This page is for education only — it is not financial advice, does not predict outcomes,
          and recommends no trade. Binary options are all-or-nothing bets that carry a high risk of
          loss, and they are restricted or banned for retail traders in a number of countries. Only
          ever risk money you can afford to lose, and confirm that this type of trading is legal
          where you live before you start.
        </p>
      </Card>
    </div>
  );
}

function Calc() {
  const [balance, setBalance] = useState(1000);
  const [risk, setRisk] = useState(2.0);
  const [winRate, setWinRate] = useState(50);
  const [payout, setPayout] = useState(85);
  const [losses, setLosses] = useState(10);

  const r = useMemo(() => {
    const tradeSize = (balance * risk) / 100;
    const dailyStop = (balance * DAILY_STOP_PCT) / 100;
    const tradesToStop = tradeSize > 0 ? dailyStop / tradeSize : 0;

    // Break-even: w * payout = (1 - w) * 1  ->  w = 1 / (1 + payout)
    const breakEven = (1 / (1 + payout / 100)) * 100;
    const edge = winRate - breakEven;

    // Capital remaining after a pure losing streak, same % risked each time.
    const remaining = balance * Math.pow(1 - risk / 100, losses);
    const remainingPct = balance > 0 ? (remaining / balance) * 100 : 0;
    const drawdownPct = 100 - remainingPct;
    const recoverPct = remaining > 0 ? (balance / remaining - 1) * 100 : 0;

    // Probability the next `losses` trades are all losing.
    const streakProb = Math.pow(1 - winRate / 100, losses);
    const oneIn = streakProb > 0 ? 1 / streakProb : Infinity;

    return {
      tradeSize,
      dailyStop,
      tradesToStop,
      breakEven,
      edge,
      remaining,
      remainingPct,
      drawdownPct,
      recoverPct,
      streakProb,
      oneIn,
    };
  }, [balance, risk, winRate, payout, losses]);

  const inDanger = r.drawdownPct >= DANGER_DRAWDOWN;

  return (
    <Card>
      <SectionTitle
        title="Find your number"
        subtitle="What does a losing streak actually cost?"
        right={<Calculator size={18} className="text-brand" />}
      />

      <p className="text-sm text-muted leading-relaxed mb-5">
        Set your balance, your risk per trade, and how often you actually win. The tool shows your
        safe trade size and daily stop, whether your win rate clears the break-even line the payout
        demands, and what a losing streak would cost — plus how likely that streak is.
      </p>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="label">Account balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
              <input
                type="number"
                min={0}
                value={balance}
                onChange={(e) => setBalance(Math.max(0, +e.target.value))}
                className="input pl-7 tabular-nums"
              />
            </div>
          </div>

          <Slider
            label="Risk per trade"
            value={risk}
            display={fmtPct(risk)}
            min={0.5}
            max={10}
            step={0.5}
            onChange={setRisk}
          />
          <Slider
            label="Win rate"
            value={winRate}
            display={`${winRate}%`}
            min={35}
            max={70}
            step={1}
            onChange={setWinRate}
          />
          <Slider
            label="Payout per win"
            value={payout}
            display={`${payout}%`}
            min={50}
            max={100}
            step={1}
            onChange={setPayout}
          />
          <Slider
            label="Consecutive losses"
            value={losses}
            display={`${losses}`}
            min={1}
            max={20}
            step={1}
            onChange={(v) => setLosses(Math.round(v))}
          />
        </div>

        {/* Headline outputs */}
        <div className="grid grid-cols-2 gap-3 content-start">
          <Stat
            label="Safe trade size"
            value={fmtMoney(r.tradeSize)}
            hint={`${fmtPct(risk)} of your balance — the most one trade should cost you`}
            tone="brand"
          />
          <Stat
            label={`Daily stop-loss · ${DAILY_STOP_PCT}%`}
            value={fmtMoney(r.dailyStop)}
            hint={`≈ ${r.tradesToStop.toFixed(1)} losing trades to your daily stop`}
            tone="warn"
          />
        </div>
      </div>

      {/* House edge */}
      <div className="card p-5 bg-panel2/40 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <TriangleAlert size={16} className="text-warn" />
          <h3 className="font-semibold tracking-tight">The house edge</h3>
        </div>
        <p className="text-sm text-muted leading-relaxed mb-4">
          At a {payout}% payout you must win{" "}
          <span className="text-text font-medium">{fmtPct(r.breakEven)}</span> of trades just to
          break even. A {winRate}% win rate is{" "}
          <span className={r.edge >= 0 ? "text-win font-medium" : "text-loss font-medium"}>
            {Math.abs(r.edge).toFixed(1)} points {r.edge >= 0 ? "above" : "below"}
          </span>{" "}
          that — {r.edge >= 0 ? "the math is on your side" : "over many trades the math works against you"}.
        </p>
        <WinRateScale winRate={winRate} breakEven={r.breakEven} min={35} max={70} />
      </div>

      {/* Drawdown */}
      <div className="card p-5 bg-panel2/40 mt-4">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Capital remaining after{" "}
          <span className="text-text font-medium">{losses} losses in a row</span> — a pure losing
          streak, the worst case — risking the same {fmtPct(risk)} of your balance each time.{" "}
          {fmtMoney(balance)} falls to{" "}
          <span className={inDanger ? "text-loss font-medium" : "text-text font-medium"}>
            {fmtMoney(r.remaining)}
          </span>
          , or {r.remainingPct.toFixed(0)}% of the starting balance, needing a{" "}
          <span className="text-text font-medium">+{r.recoverPct.toFixed(0)}%</span> gain to recover.
        </p>

        <DrawdownBar remainingPct={r.remainingPct} losses={losses} inDanger={inDanger} />

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat
            label="Capital left"
            value={`${r.remainingPct.toFixed(0)}%`}
            hint={fmtMoney(r.remaining)}
            tone={inDanger ? "loss" : "default"}
          />
          <Stat
            label="Gain needed to recover"
            value={`+${r.recoverPct.toFixed(0)}%`}
            tone="warn"
          />
          <Stat
            label="Chance of this streak"
            value={r.oneIn === Infinity ? "—" : `1 in ${Math.round(r.oneIn).toLocaleString()}`}
            hint={`≈ ${(r.streakProb * 100).toFixed(2)}% · next ${losses} all losing`}
          />
        </div>
      </div>
    </Card>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-semibold tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-brand cursor-pointer"
      />
    </div>
  );
}

function WinRateScale({
  winRate,
  breakEven,
  min,
  max,
}: {
  winRate: number;
  breakEven: number;
  min: number;
  max: number;
}) {
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`;
  const youAhead = winRate >= breakEven;
  return (
    <div>
      <div className="relative h-9">
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-loss/40 via-warn/40 to-win/40" />
        {/* break-even marker */}
        <Marker pos={pos(breakEven)} color="bg-muted" label="break-even" labelClass="text-muted" />
        {/* you marker */}
        <Marker
          pos={pos(winRate)}
          color={youAhead ? "bg-win" : "bg-loss"}
          label="you"
          labelClass={youAhead ? "text-win" : "text-loss"}
          below
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted mt-3">
        <span>{min}%</span>
        <span>Win-rate scale</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

function Marker({
  pos,
  color,
  label,
  labelClass,
  below,
}: {
  pos: string;
  color: string;
  label: string;
  labelClass: string;
  below?: boolean;
}) {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: pos }}>
      <div className={`w-3 h-3 rounded-full ${color} ring-2 ring-panel`} />
      <span
        className={`absolute left-1/2 -translate-x-1/2 text-[11px] font-medium whitespace-nowrap ${labelClass} ${
          below ? "top-4" : "bottom-4"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function DrawdownBar({
  remainingPct,
  losses,
  inDanger,
}: {
  remainingPct: number;
  losses: number;
  inDanger: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, remainingPct));
  return (
    <div>
      <div className="relative h-32 rounded-lg bg-panel2/60 border border-border overflow-hidden">
        {/* danger zone: bottom 30% (i.e. below 70% capital) */}
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-loss/10 border-t border-dashed border-loss/40" />
        <div className="absolute right-2 top-[calc(70%-0.6rem)] text-[10px] text-loss/80">
          danger zone · 30% drawdown
        </div>
        {/* capital column */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-[height] ${
            inDanger ? "bg-loss/30" : "bg-win/25"
          }`}
          style={{ height: `${clamped}%` }}
        >
          <div
            className={`absolute inset-x-0 top-0 h-0.5 ${inDanger ? "bg-loss" : "bg-win"}`}
          />
          <span
            className={`absolute right-2 top-1.5 text-xs font-semibold tabular-nums ${
              inDanger ? "text-loss" : "text-win"
            }`}
          >
            {remainingPct.toFixed(0)}%
          </span>
        </div>
        {/* gridlines */}
        {[70, 50].map((g) => (
          <div
            key={g}
            className="absolute inset-x-0 border-t border-border/50 text-[10px] text-muted"
            style={{ bottom: `${g}%` }}
          >
            <span className="absolute left-1 -top-3">{g}%</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted mt-2">
        <span>0 losses</span>
        <Badge tone={inDanger ? "loss" : "win"}>{losses} losses</Badge>
        <span>capital left</span>
      </div>
    </div>
  );
}
