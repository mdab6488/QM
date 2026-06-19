"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, MobileNav } from "./Sidebar";
import { Topbar } from "./Topbar";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadState, startPersistence, stopPersistence } from "@/lib/persistence";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    const supabase = getSupabaseClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      if (!user) {
        useStore.getState().reset();
        stopPersistence();
        if (!isLogin) router.replace("/login");
        return;
      }
      if (isLogin) {
        router.replace("/trades");
        return;
      }
      const state = await loadState(user.id);
      if (!active) return;
      useStore.getState().hydrate(state ?? {});
      startPersistence(user.id);
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        useStore.getState().reset();
        stopPersistence();
        if (!isLogin) router.replace("/login");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname, configured, isLogin, router]);

  if (!configured) return <ConfigNotice />;

  // The login page renders without the app chrome.
  if (isLogin) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function ConfigNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card p-8 max-w-lg">
        <h1 className="text-lg font-semibold">Connect Supabase to continue</h1>
        <p className="text-sm text-muted mt-2">
          This app stores your data in Supabase. Add your project credentials to a{" "}
          <code className="text-text">.env.local</code> file in the project root:
        </p>
        <pre className="mt-3 text-xs bg-panel2 rounded-lg p-3 overflow-x-auto text-text">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="text-xs text-muted mt-3">
          Then run the SQL in <code className="text-text">supabase/migrations</code> from your
          Supabase dashboard, and restart the dev server. See the README for full setup steps.
        </p>
      </div>
    </div>
  );
}
