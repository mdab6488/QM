"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, MoodLog, Settings, Trade, TradingRule } from "./types";
import { uid } from "./utils";
import { seedTrades, seedRules } from "./seed";

const DEFAULT_SETTINGS: Settings = {
  traderName: "Trader",
  startingBalance: 1000,
  currency: "$",
  dailyLossLimit: 200,
  dailyProfitTarget: 200,
  maxTradesPerDay: 10,
  riskPerTradePct: 2,
};

interface StoreActions {
  addTrade: (t: Omit<Trade, "id">) => void;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  importTrades: (rows: Omit<Trade, "id">[]) => void;
  clearTrades: () => void;

  addMood: (m: Omit<MoodLog, "id">) => void;
  deleteMood: (id: string) => void;

  addRule: (text: string) => void;
  toggleRule: (id: string) => void;
  deleteRule: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;

  loadSeed: () => void;
  resetAll: () => void;
  hydrated: boolean;
  setHydrated: () => void;
}

export type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set) => ({
      trades: [],
      moods: [],
      rules: [],
      settings: DEFAULT_SETTINGS,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      addTrade: (t) => set((s) => ({ trades: [...s.trades, { ...t, id: uid() }] })),
      updateTrade: (id, patch) =>
        set((s) => ({
          trades: s.trades.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteTrade: (id) => set((s) => ({ trades: s.trades.filter((x) => x.id !== id) })),
      importTrades: (rows) =>
        set((s) => ({ trades: [...s.trades, ...rows.map((r) => ({ ...r, id: uid() }))] })),
      clearTrades: () => set({ trades: [] }),

      addMood: (m) => set((s) => ({ moods: [...s.moods, { ...m, id: uid() }] })),
      deleteMood: (id) => set((s) => ({ moods: s.moods.filter((x) => x.id !== id) })),

      addRule: (text) =>
        set((s) => ({ rules: [...s.rules, { id: uid(), text, active: true } as TradingRule] })),
      toggleRule: (id) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
        })),
      deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      loadSeed: () =>
        set((s) => ({
          trades: s.trades.length ? s.trades : seedTrades(),
          rules: s.rules.length ? s.rules : seedRules(),
        })),
      resetAll: () =>
        set({ trades: [], moods: [], rules: [], settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "qm-trading-cockpit",
      version: 1,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);
