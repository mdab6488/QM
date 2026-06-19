"use client";

import { create } from "zustand";
import {
  Account,
  AppState,
  Group,
  GroupTxn,
  MoodLog,
  Session,
  SessionEntry,
  Settings,
  Trade,
  TradingRule,
} from "./types";
import { uid } from "./utils";
import { nextGroupName, nextSessionName } from "./stats";

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

  /** Create a group. The name is auto-generated in sequence (Group 1, 2, …).
   *  If `fundFromGroupId` is set, that group is withdrawn the deposit amount
   *  (a transfer) and the new group is credited it. */
  addGroup: (g: { goal: number; notes?: string; deposit: number }, fundFromGroupId?: string) => string;
  updateGroup: (id: string, patch: Partial<Pick<Group, "name" | "goal" | "notes">>) => void;
  deleteGroup: (id: string) => void;
  addTxn: (groupId: string, t: Omit<GroupTxn, "id">) => void;
  deleteTxn: (groupId: string, txnId: string) => void;

  /** Create a session. Name is auto-numbered within its group and the date is
   *  stamped with the current date-time automatically. */
  addSession: (s: Omit<Session, "id" | "entries" | "name" | "date">) => string;
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

  /** Replace store contents with a loaded document (from Supabase). */
  hydrate: (data: Partial<AppState>) => void;
  /** Clear everything in memory (on sign-out). */
  reset: () => void;
  hydrated: boolean;

  /** Signed-in user identity (not persisted to the data document). */
  account: Account | null;
  setAccount: (a: Account | null) => void;
}

export type Store = AppState & StoreActions;

export const useStore = create<Store>()((set) => ({
      trades: [],
      groups: [],
      sessions: [],
      moods: [],
      rules: [],
      settings: DEFAULT_SETTINGS,
      hydrated: false,
      account: null,
      setAccount: (a) => set({ account: a }),

      addTrade: (t) => set((s) => ({ trades: [...s.trades, { ...t, id: uid() }] })),
      updateTrade: (id, patch) =>
        set((s) => ({
          trades: s.trades.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteTrade: (id) => set((s) => ({ trades: s.trades.filter((x) => x.id !== id) })),
      importTrades: (rows) =>
        set((s) => ({ trades: [...s.trades, ...rows.map((r) => ({ ...r, id: uid() }))] })),
      clearTrades: () => set({ trades: [] }),

      addGroup: (g, fundFromGroupId) => {
        const id = uid();
        const today = new Date().toISOString().slice(0, 10);
        set((st) => {
          const name = nextGroupName(st.groups);
          const newGroup: Group = {
            id,
            name,
            goal: g.goal,
            notes: g.notes ?? "",
            createdAt: today,
            txns: [
              {
                id: uid(),
                date: today,
                type: "DEPOSIT",
                amount: g.deposit,
                note: fundFromGroupId ? "Transfer in" : "Initial deposit",
              },
            ],
          };
          // If funded from another group, record the matching withdrawal there.
          const groups = st.groups.map((x) =>
            x.id === fundFromGroupId
              ? {
                  ...x,
                  txns: [
                    ...x.txns,
                    {
                      id: uid(),
                      date: today,
                      type: "WITHDRAW" as const,
                      amount: g.deposit,
                      note: `Transfer to ${name}`,
                    },
                  ],
                }
              : x
          );
          return { groups: [...groups, newGroup] };
        });
        return id;
      },
      updateGroup: (id, patch) =>
        set((st) => ({
          groups: st.groups.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteGroup: (id) =>
        set((st) => ({
          groups: st.groups.filter((x) => x.id !== id),
          sessions: st.sessions.filter((s) => s.groupId !== id),
        })),
      addTxn: (groupId, t) =>
        set((st) => ({
          groups: st.groups.map((x) =>
            x.id === groupId ? { ...x, txns: [...x.txns, { ...t, id: uid() }] } : x
          ),
        })),
      deleteTxn: (groupId, txnId) =>
        set((st) => ({
          groups: st.groups.map((x) =>
            x.id === groupId ? { ...x, txns: x.txns.filter((t) => t.id !== txnId) } : x
          ),
        })),

      addSession: (s) => {
        const id = uid();
        set((st) => {
          const inGroup = st.sessions.filter((x) => x.groupId === s.groupId);
          const name = nextSessionName(inGroup);
          const date = new Date().toISOString();
          return { sessions: [...st.sessions, { ...s, id, name, date, entries: [] }] };
        });
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

      hydrate: (data) =>
        set({
          trades: data.trades ?? [],
          groups: data.groups ?? [],
          sessions: data.sessions ?? [],
          moods: data.moods ?? [],
          rules: data.rules ?? [],
          settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
          hydrated: true,
        }),
      reset: () =>
        set({
          trades: [],
          groups: [],
          sessions: [],
          moods: [],
          rules: [],
          settings: DEFAULT_SETTINGS,
          hydrated: false,
          account: null,
        }),
}));
