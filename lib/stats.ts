import { NEGATIVE_EMOTIONS, Session, SessionEntry, Trade } from "./types";

export interface KPIs {
  totalTrades: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;        // %
  netPnl: number;
  grossProfit: number;
  grossLoss: number;      // positive number
  profitFactor: number;   // grossProfit / grossLoss
  avgWin: number;
  avgLoss: number;        // negative
  expectancy: number;     // avg pnl per trade
  bestTrade: number;
  worstTrade: number;
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: number;  // + win streak, - loss streak
  avgInvestment: number;
  totalInvested: number;
  planAdherence: number;  // % trades that followed plan
  disciplineScore: number; // 0-100 composite
  maxDrawdown: number;    // absolute, from equity curve
}

export function chronological(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => a.date.localeCompare(b.date));
}

export function computeKPIs(trades: Trade[], startingBalance = 0): KPIs {
  const t = chronological(trades);
  const n = t.length;
  const wins = t.filter((x) => x.outcome === "WIN");
  const losses = t.filter((x) => x.outcome === "LOSS");
  const draws = t.filter((x) => x.outcome === "DRAW");

  const netPnl = sum(t.map((x) => x.pnl));
  const grossProfit = sum(t.filter((x) => x.pnl > 0).map((x) => x.pnl));
  const grossLoss = Math.abs(sum(t.filter((x) => x.pnl < 0).map((x) => x.pnl)));
  const decided = wins.length + losses.length;

  const { maxWin, maxLoss, current } = streaks(t);
  const eq = equityCurve(t, startingBalance);
  const maxDrawdown = maxDrawdownFrom(eq.map((p) => p.equity));

  const followed = t.filter((x) => x.followedPlan).length;
  const planAdherence = n ? (followed / n) * 100 : 0;

  return {
    totalTrades: n,
    wins: wins.length,
    losses: losses.length,
    draws: draws.length,
    winRate: decided ? (wins.length / decided) * 100 : 0,
    netPnl,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss,
    avgWin: wins.length ? grossProfit / wins.length : 0,
    avgLoss: losses.length ? -grossLoss / losses.length : 0,
    expectancy: n ? netPnl / n : 0,
    bestTrade: n ? Math.max(...t.map((x) => x.pnl)) : 0,
    worstTrade: n ? Math.min(...t.map((x) => x.pnl)) : 0,
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
    currentStreak: current,
    avgInvestment: n ? sum(t.map((x) => x.investment)) / n : 0,
    totalInvested: sum(t.map((x) => x.investment)),
    planAdherence,
    disciplineScore: disciplineScore(t),
    maxDrawdown,
  };
}

function streaks(t: Trade[]) {
  let maxWin = 0,
    maxLoss = 0,
    cur = 0;
  for (const x of t) {
    if (x.outcome === "WIN") cur = cur >= 0 ? cur + 1 : 1;
    else if (x.outcome === "LOSS") cur = cur <= 0 ? cur - 1 : -1;
    else continue;
    if (cur > 0) maxWin = Math.max(maxWin, cur);
    if (cur < 0) maxLoss = Math.max(maxLoss, Math.abs(cur));
  }
  return { maxWin, maxLoss, current: cur };
}

export interface EquityPoint {
  index: number;
  date: string;
  equity: number;
  pnl: number;
}

export function equityCurve(trades: Trade[], startingBalance = 0): EquityPoint[] {
  const t = chronological(trades);
  let running = startingBalance;
  return t.map((x, i) => {
    running += x.pnl;
    return { index: i + 1, date: x.date, equity: round2(running), pnl: x.pnl };
  });
}

function maxDrawdownFrom(equity: number[]): number {
  let peak = -Infinity;
  let maxDd = 0;
  for (const e of equity) {
    peak = Math.max(peak, e);
    maxDd = Math.max(maxDd, peak - e);
  }
  return round2(maxDd);
}

/**
 * Discipline score (0-100): rewards plan adherence, penalises negative-emotion
 * trading and tagged mistakes, and rewards consistent process over outcome.
 */
export function disciplineScore(trades: Trade[]): number {
  if (!trades.length) return 0;
  const n = trades.length;
  const planRate = trades.filter((x) => x.followedPlan).length / n;
  const calmRate =
    trades.filter((x) => !NEGATIVE_EMOTIONS.includes(x.emotionBefore)).length / n;
  const mistakeRate = trades.filter((x) => x.mistakes.length > 0).length / n;
  const raw = planRate * 55 + calmRate * 35 - mistakeRate * 25 + 10;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

// ---- Breakdown helpers ----

export interface GroupStat {
  key: string;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
}

export function groupBy(trades: Trade[], keyFn: (t: Trade) => string): GroupStat[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = keyFn(t) || "—";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  }
  const out: GroupStat[] = [];
  for (const [key, list] of map) {
    const decided = list.filter((x) => x.outcome !== "DRAW").length;
    const wins = list.filter((x) => x.outcome === "WIN").length;
    out.push({
      key,
      trades: list.length,
      wins,
      winRate: decided ? (wins / decided) * 100 : 0,
      pnl: round2(sum(list.map((x) => x.pnl))),
    });
  }
  return out.sort((a, b) => b.pnl - a.pnl);
}

export function byHourOfDay(trades: Trade[]): GroupStat[] {
  const stats = groupBy(trades, (t) => String(new Date(t.date).getHours()).padStart(2, "0") + ":00");
  return stats.sort((a, b) => a.key.localeCompare(b.key));
}

export function byWeekday(trades: Trade[]): GroupStat[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const stats = groupBy(trades, (t) => days[new Date(t.date).getDay()]);
  return stats.sort((a, b) => days.indexOf(a.key) - days.indexOf(b.key));
}

export interface DailyStat {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
}

export function byDay(trades: Trade[]): DailyStat[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const d = t.date.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(t);
  }
  return [...map.entries()]
    .map(([date, list]) => ({
      date,
      pnl: round2(sum(list.map((x) => x.pnl))),
      trades: list.length,
      wins: list.filter((x) => x.outcome === "WIN").length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---- session (money-management) math ----

/** Amount returned by a step: the payout if it won, otherwise nothing. */
export function entryReturn(e: SessionEntry): number {
  return e.outcome === "WIN" ? e.payout : 0;
}

/** Net profit/loss of a single step. */
export function entryPnl(e: SessionEntry): number {
  return round2(entryReturn(e) - e.investment);
}

export interface SessionStats {
  invested: number;     // total deployed across decided + pending steps
  returned: number;     // total returned by winning steps
  net: number;          // returned - invested
  roi: number;          // net / invested * 100
  baseSize: number;     // capital / steps (planned per-step stake)
  entries: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;      // % of decided steps that won
}

export function computeSession(s: Session): SessionStats {
  const decided = s.entries.filter((e) => e.outcome !== "PENDING");
  const wins = s.entries.filter((e) => e.outcome === "WIN").length;
  const losses = s.entries.filter((e) => e.outcome === "LOSS").length;
  const pending = s.entries.filter((e) => e.outcome === "PENDING").length;
  const invested = round2(sum(s.entries.map((e) => e.investment)));
  const returned = round2(sum(s.entries.map(entryReturn)));
  const net = round2(returned - invested);
  return {
    invested,
    returned,
    net,
    roi: invested ? round2((net / invested) * 100) : 0,
    baseSize: s.steps ? round2(s.capital / s.steps) : 0,
    entries: s.entries.length,
    wins,
    losses,
    pending,
    winRate: decided.length ? round2((wins / decided.length) * 100) : 0,
  };
}

export interface SessionsSummary {
  count: number;
  net: number;          // grand total across sessions
  invested: number;
  returned: number;
  winners: number;      // sessions that ended net positive
  losers: number;
  bestNet: number;
  worstNet: number;
}

export function summarizeSessions(sessions: Session[]): SessionsSummary {
  const nets = sessions.map((s) => computeSession(s).net);
  return {
    count: sessions.length,
    net: round2(sum(nets)),
    invested: round2(sum(sessions.map((s) => computeSession(s).invested))),
    returned: round2(sum(sessions.map((s) => computeSession(s).returned))),
    winners: nets.filter((n) => n > 0).length,
    losers: nets.filter((n) => n < 0).length,
    bestNet: nets.length ? Math.max(...nets) : 0,
    worstNet: nets.length ? Math.min(...nets) : 0,
  };
}

// ---- small math helpers ----
export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
