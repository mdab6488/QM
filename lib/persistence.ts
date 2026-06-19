"use client";

import { getSupabaseClient } from "./supabase/client";
import { useStore } from "./store";
import type { AppState } from "./types";

const TABLE = "app_state";

export type PersistedState = Pick<
  AppState,
  "trades" | "groups" | "sessions" | "moods" | "rules" | "settings"
>;

function serialize(): PersistedState {
  const s = useStore.getState();
  return {
    trades: s.trades,
    groups: s.groups,
    sessions: s.sessions,
    moods: s.moods,
    rules: s.rules,
    settings: s.settings,
  };
}

/** Load the current user's saved document. Returns null for a brand-new user. */
export async function loadState(userId: string): Promise<Partial<PersistedState> | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Failed to load state from Supabase:", error.message);
    return null;
  }
  return (data?.data ?? null) as Partial<PersistedState> | null;
}

/** Upsert the whole document for the user. */
export async function saveState(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: serialize(), updated_at: new Date().toISOString() });
  if (error) console.error("Failed to save state to Supabase:", error.message);
}

let started = false;
let unsub: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Subscribe to store changes and debounce-save them to Supabase. Idempotent. */
export function startPersistence(userId: string): void {
  if (started) return;
  started = true;
  unsub = useStore.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void saveState(userId), 700);
  });
}

export function stopPersistence(): void {
  started = false;
  if (unsub) {
    unsub();
    unsub = null;
  }
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
