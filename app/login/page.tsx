"use client";

import { useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { CandlestickChart } from "lucide-react";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const signInWithGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // On success the browser is redirected to Google, so nothing else to do.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <CandlestickChart className="text-brand" size={24} />
          <div>
            <div className="font-semibold leading-tight">QM Money Management</div>
            <div className="text-[11px] text-muted leading-tight">market-qx.trade</div>
          </div>
        </div>

        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-sm text-muted mt-1">
          Continue with your Google account to access your cockpit.
        </p>

        {!configured && (
          <p className="text-xs text-loss mt-3">
            Supabase isn&apos;t configured yet. Add your env vars (see README) before signing in.
          </p>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={busy || !configured}
          className="btn-ghost w-full mt-6 justify-center bg-white text-gray-800 hover:bg-gray-100 border-transparent disabled:opacity-50"
        >
          <GoogleIcon />
          {busy ? "Redirecting…" : "Continue with Google"}
        </button>

        {error && <p className="text-sm text-loss mt-3">{error}</p>}

        <p className="text-[11px] text-muted mt-6 text-center">
          New here? Signing in with Google creates your account automatically.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
