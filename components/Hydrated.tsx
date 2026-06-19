"use client";

import { ReactNode } from "react";
import { useStore } from "@/lib/store";

/** Renders children only after zustand has rehydrated from localStorage,
 * avoiding SSR/client markup mismatches. */
export function Hydrated({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-32 text-muted text-sm">
        Loading your cockpit…
      </div>
    );
  }
  return <>{children}</>;
}
