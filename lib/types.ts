// Core domain types for the QM Trading Cockpit.

export type Direction = "CALL" | "PUT"; // QX = binary up/down
export type Outcome = "WIN" | "LOSS" | "DRAW";

export type AssetClass = "Forex" | "Crypto" | "Stocks" | "Commodities" | "Indices" | "OTC";

export type Emotion =
  | "Calm"
  | "Confident"
  | "Focused"
  | "Greedy"
  | "Fearful"
  | "Revenge"
  | "Anxious"
  | "Bored"
  | "FOMO"
  | "Tilted";

/** A single trade. PnL is the net result in account currency (already includes payout/loss). */
export interface Trade {
  id: string;
  date: string;        // ISO date-time of entry
  asset: string;       // e.g. "EUR/USD", "BTC/USD"
  assetClass: AssetClass;
  direction: Direction;
  timeframe: string;   // e.g. "1m", "5m"
  investment: number;  // stake
  payoutPct: number;   // broker payout % (e.g. 85)
  outcome: Outcome;
  pnl: number;         // net profit/loss
  // Discipline / process
  followedPlan: boolean;
  strategy: string;    // strategy / setup tag
  emotionBefore: Emotion;
  emotionAfter: Emotion;
  confidence: number;  // 1-5 self-rated conviction
  mistakes: string[];  // tagged mistakes
  notes: string;
  tags: string[];
  session?: string;    // optional grouping (e.g. "S1") for legacy import
}

/** A daily psychology / wellbeing check-in, independent of individual trades. */
export interface MoodLog {
  id: string;
  date: string;        // ISO date
  sleepHours: number;
  stress: number;      // 1-5
  energy: number;      // 1-5
  followedRules: boolean;
  mood: Emotion;
  note: string;
}

/** A personal trading rule the user commits to. */
export interface TradingRule {
  id: string;
  text: string;
  active: boolean;
}

export interface Settings {
  traderName: string;
  startingBalance: number;
  currency: string;          // symbol e.g. "$"
  dailyLossLimit: number;    // absolute amount; tilt guard
  dailyProfitTarget: number;
  maxTradesPerDay: number;
  riskPerTradePct: number;   // % of balance suggested per trade
}

export interface AppState {
  trades: Trade[];
  moods: MoodLog[];
  rules: TradingRule[];
  settings: Settings;
}

export const MISTAKE_TAGS = [
  "Overtrading",
  "No setup / FOMO",
  "Revenge trade",
  "Moved against plan",
  "Oversized stake",
  "Traded news spike",
  "Chased price",
  "Ignored trend",
  "Too early entry",
  "Held emotion",
] as const;

export const STRATEGY_TAGS = [
  "Trend follow",
  "Support/Resistance",
  "Reversal",
  "Breakout",
  "Pullback",
  "Pattern",
  "News play",
  "Scalp",
  "Gut feel",
] as const;

export const ASSET_CLASSES: AssetClass[] = [
  "Forex",
  "Crypto",
  "Stocks",
  "Commodities",
  "Indices",
  "OTC",
];

export const EMOTIONS: Emotion[] = [
  "Calm",
  "Confident",
  "Focused",
  "Greedy",
  "Fearful",
  "Revenge",
  "Anxious",
  "Bored",
  "FOMO",
  "Tilted",
];

/** Emotions considered "negative" for discipline scoring. */
export const NEGATIVE_EMOTIONS: Emotion[] = [
  "Greedy",
  "Fearful",
  "Revenge",
  "Anxious",
  "Bored",
  "FOMO",
  "Tilted",
];
