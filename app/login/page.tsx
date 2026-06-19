"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui";
import { CandlestickChart } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Account created. If email confirmation is on, check your inbox — otherwise sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/trades");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
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

        <h1 className="text-lg font-semibold">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-sm text-muted mt-1">
          {mode === "signin"
            ? "Welcome back — sign in to your cockpit."
            : "Set up your account to start tracking."}
        </p>

        {!configured && (
          <p className="text-xs text-loss mt-3">
            Supabase isn&apos;t configured yet. Add your env vars (see README) before signing in.
          </p>
        )}

        <form className="space-y-3 mt-5" onSubmit={submit}>
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <p className="text-sm text-loss">{error}</p>}
          {info && <p className="text-sm text-win">{info}</p>}

          <button type="submit" className="btn-primary w-full" disabled={busy || !configured}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          className="text-sm text-muted hover:text-text mt-4 w-full text-center"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
        >
          {mode === "signin"
            ? "Don't have an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
