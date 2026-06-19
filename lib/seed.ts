import { Session, SessionEntry, Trade, TradingRule } from "./types";
import { uid } from "./utils";

/**
 * Seed data reconstructed from the original QX.xlsx session tracker
 * (sessions S1-S7 with their PnL results). These are expanded into
 * sample trades so the cockpit has something to visualise on first run.
 * Replace or clear from Settings once you log real trades.
 */
const SESSION_PNL: { session: string; pnl: number }[] = [
  { session: "S1", pnl: -193 },
  { session: "S2", pnl: -1 },
  { session: "S3", pnl: 141 },
  { session: "S4", pnl: -131 },
  { session: "S5", pnl: -71 },
  { session: "S6", pnl: 142 },
  { session: "S7", pnl: 107 },
];

const ASSETS = ["EUR/USD", "GBP/USD", "BTC/USD", "Gold", "USD/JPY", "ETH/USD"];

export function seedTrades(): Trade[] {
  const out: Trade[] = [];
  const base = new Date();
  base.setDate(base.getDate() - SESSION_PNL.length);

  SESSION_PNL.forEach((sess, si) => {
    // Spread each session's net result across 3 representative trades.
    const day = new Date(base);
    day.setDate(base.getDate() + si);
    const parts = splitInto(sess.pnl, 3);
    parts.forEach((p, pi) => {
      const date = new Date(day);
      date.setHours(9 + pi * 2, (pi * 17) % 60, 0, 0);
      const win = p >= 0;
      out.push({
        id: uid(),
        date: date.toISOString(),
        asset: ASSETS[(si + pi) % ASSETS.length],
        assetClass: "Forex",
        direction: pi % 2 === 0 ? "CALL" : "PUT",
        timeframe: "5m",
        investment: 100,
        payoutPct: 85,
        outcome: win ? "WIN" : "LOSS",
        pnl: p,
        followedPlan: win || pi !== 0,
        strategy: win ? "Trend follow" : "Reversal",
        emotionBefore: win ? "Focused" : si < 2 ? "Revenge" : "Anxious",
        emotionAfter: win ? "Confident" : "Anxious",
        confidence: win ? 4 : 2,
        mistakes: win ? [] : pi === 0 ? ["Revenge trade"] : ["No setup / FOMO"],
        notes: "",
        tags: [],
        session: sess.session,
      });
    });
  });

  return out;
}

/** Split a total into n parts that sum exactly, with realistic win/loss mix. */
function splitInto(total: number, n: number): number[] {
  const win = 85; // payout on $100 stake
  const loss = -100;
  // simple search for a combination of wins/losses approximating total
  for (let w = n; w >= 0; w--) {
    const l = n - w;
    const guess = w * win + l * loss;
    if (Math.sign(guess) === Math.sign(total) || total === 0) {
      const parts = [
        ...Array(w).fill(win),
        ...Array(l).fill(loss),
      ];
      // adjust last element so it sums exactly to total
      const diff = total - parts.reduce((a, b) => a + b, 0);
      parts[parts.length - 1] += diff;
      return parts;
    }
  }
  return [total];
}

/**
 * Sessions transcribed from QX.xlsx (one sheet per session). Each tuple is
 * [investment, payout, won] for one step. For winning steps the payout is the
 * amount actually returned in the original sheet; losing steps return nothing.
 * Net per session = sum(returned on wins) - sum(invested), matching the
 * QX "Sessions" overview (S1 uses the five steps that fed its total).
 */
type Step = [investment: number, payout: number, won: boolean];

const SESSION_DATA: { name: string; capital: number; steps: Step[] }[] = [
  {
    name: "S1",
    capital: 603,
    steps: [
      [120, 225, false],
      [120, 225, false],
      [120, 225, false],
      [57, 108, true],
      [129, 245, true],
    ],
  },
  {
    name: "S2",
    capital: 353,
    steps: [
      [23, 43, false],
      [23, 43, false],
      [46, 87, true],
      [23, 42, false],
      [46, 87, false],
      [46, 84, true],
      [46, 84, true],
      [23, 43, false],
      [23, 43, true],
    ],
  },
  {
    name: "S3",
    capital: 400,
    steps: [
      [26, 49, true],
      [26, 46, true],
      [26, 49, false],
      [80, 152, true],
      [80, 146, true],
      [80, 146, true],
      [80, 146, false],
    ],
  },
  {
    name: "S4",
    capital: 543,
    steps: [
      [80, 152, true],
      [28, 53, true],
      [108, 205, false],
      [108, 205, false],
      [108.6, 205, false],
      [108.6, 205, true],
    ],
  },
  {
    name: "S5",
    capital: 413,
    steps: [
      [82.6, 150, true],
      [82.6, 153.34, false],
      [82.6, 153.34, false],
      [82.6, 153.34, false],
      [82.6, 153.34, false],
      [82.6, 150, true],
      [71, 71, true],
      [150, 274, true],
    ],
  },
  {
    name: "S6",
    capital: 346,
    steps: [
      [69, 129, false],
      [69, 126, true],
      [69, 129, false],
      [69, 129, true],
      [69, 126, true],
      [128, 234, true],
    ],
  },
  {
    name: "S7",
    capital: 489,
    steps: [
      [97, 175, false],
      [97, 175, true],
      [97, 175, false],
      [97, 177, true],
      [97, 177, true],
      [97, 177, true],
      [97, 177, false],
      [97, 177, true],
    ],
  },
  {
    name: "S8",
    capital: 518,
    steps: [
      [103, 193, true],
      [103, 189, true],
      [103, 189, true],
      [103, 189, false],
      [103, 190, true],
      [103, 189, false],
      [103, 189, false],
      [103, 189, false],
      [103, 189, false],
    ],
  },
];

export function seedSessions(): Session[] {
  const base = new Date();
  base.setDate(base.getDate() - SESSION_DATA.length);

  return SESSION_DATA.map((s, si) => {
    const day = new Date(base);
    day.setDate(base.getDate() + si + 1);
    const entries: SessionEntry[] = s.steps.map(([investment, payout, won]) => ({
      id: uid(),
      investment,
      payout,
      outcome: won ? "WIN" : "LOSS",
    }));
    return {
      id: uid(),
      name: s.name,
      date: day.toISOString().slice(0, 10),
      capital: s.capital,
      steps: 5,
      notes: "",
      entries,
    };
  });
}

export function seedRules(): TradingRule[] {
  return [
    "No trade without a defined setup",
    "Max 2% of balance per trade",
    "Stop after hitting daily loss limit",
    "No revenge trades — walk away after 2 losses",
    "No trading during high-impact news unless it's the plan",
    "Journal every trade before the next one",
  ].map((text) => ({ id: uid(), text, active: true }));
}
