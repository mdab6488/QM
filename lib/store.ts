"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, MoodLog, Session, SessionEntry, Settings, Trade, TradingRule } from "./types";
import { uid } from "./utils";
import { seedTrades, seedRules, seedSessions } from "./seed";

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

  addSession: (s: Omit<Session, "id" | "entries">) => string;
  updateSession: (id: string, patch: Partial<Omit<Session, "id" | "entries">>) => void;
  deleteSession: (id: string) => void;
  addEntry: (sessionId: string, e: Omit<SessionEntry, "id">) => void;
  updateEntry: (sessionId: string, entryId: string, patch: Partial<SessionEntry>) => void;
  deleteEntry: (sessionId: string, entryId: string) => void;

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
      sessions: [],
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

      addSession: (s) => {
        const id = uid();
        set((st) => ({ sessions: [...st.sessions, { ...s, id, entries: [] }] }));
        return id;
      },
      updateSession: (id, patch) =>
        set((st) => ({
          sessions: st.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteSession: (id) =>
        set((st) => ({ sessions: st.sessions.filter((x) => x.id !== id) })),
      addEntry: (sessionId, e) =>
        set((st) => ({
          sessions: st.sessions.map((x) =>
            x.id === sessionId ? { ...x, entries: [...x.entries, { ...e, id: uid() }] } : x
          ),
        })),
      updateEntry: (sessionId, entryId, patch) =>
        set((st) => ({
          sessions: st.sessions.map((x) =>
            x.id === sessionId
              ? {
                  ...x,
                  entries: x.entries.map((en) =>
                    en.id === entryId ? { ...en, ...patch } : en
                  ),
                }
              : x
          ),
        })),
      deleteEntry: (sessionId, entryId) =>
        set((st) => ({
          sessions: st.sessions.map((x) =>
            x.id === sessionId
              ? { ...x, entries: x.entries.filter((en) => en.id !== entryId) }
              : x
          ),
        })),

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
          sessions: s.sessions.length ? s.sessions : seedSessions(),
          rules: s.rules.length ? s.rules : seedRules(),
        })),
      resetAll: () =>
        set({ trades: [], sessions: [], moods: [], rules: [], settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "qm-trading-cockpit",
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        if (version < 2 && !state.sessions) state.sessions = [];
        return state as AppState;
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);
