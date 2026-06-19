"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { ExternalLink, RefreshCw, AlertTriangle, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  link: string;
  date: string;
  source: string;
  category: string;
  summary: string;
}

const CATS = ["All", "Forex", "Crypto", "Economy"];

// High-impact recurring events that move QX assets. Educational watchlist,
// not live data — always confirm exact times on a live calendar.
const KEY_EVENTS = [
  { name: "Non-Farm Payrolls (NFP)", when: "1st Friday, 13:30 UTC", impact: "USD pairs, Gold, Indices", note: "Huge volatility spike — most pros stand aside in the first minutes." },
  { name: "FOMC Rate Decision", when: "8x / year, 19:00 UTC", impact: "USD, Gold, Crypto, Indices", note: "Rate + Powell presser. Trend can reverse violently." },
  { name: "CPI Inflation (US)", when: "Mid-month, 13:30 UTC", impact: "USD, Gold, Crypto", note: "Inflation surprise = sharp directional moves." },
  { name: "ECB Rate Decision", when: "8x / year, 13:15 UTC", impact: "EUR pairs", note: "Watch EUR/USD, EUR/GBP." },
  { name: "Bitcoin ETF / macro flows", when: "Ongoing", impact: "BTC, ETH, alts", note: "Crypto reacts to risk sentiment and US session opens." },
];

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [cat, setCat] = useState("All");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      if (!res.ok) throw new Error("Feed request failed");
      const data = await res.json();
      setItems(data.items || []);
      setUpdatedAt(data.updatedAt || "");
    } catch (e: any) {
      setError("Couldn't load live news (network or feed blocked). Try refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = cat === "All" ? items : items.filter((i) => i.category === cat);

  return (
    <div className="space-y-5">
      <SectionTitle
        title="News & Economic Calendar"
        subtitle="Stay ahead of the moves — react to events, don't get caught by them"
        right={
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="card p-3 bg-warn/5 border-warn/20 flex gap-3 text-sm">
        <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
        <p className="text-muted">
          <span className="text-text font-medium">Reality check:</span> news helps you{" "}
          <span className="text-text">avoid bad moments and understand context</span> — it does not
          predict exact price direction. Treat high-impact events as <em>volatility warnings</em>, size
          down or stand aside, and let your journal (not a headline) decide your edge.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "chip border",
                  cat === c ? "bg-brand/15 text-brand border-brand/30" : "border-border text-muted hover:text-text"
                )}
              >
                {c}
              </button>
            ))}
            {updatedAt && (
              <span className="ml-auto text-xs text-muted self-center">
                Updated {new Date(updatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {loading && <EmptyState title="Loading latest market news…" />}
          {error && !loading && (
            <EmptyState title="News unavailable" hint={error} />
          )}

          {!loading &&
            !error &&
            filtered.map((n, i) => (
              <a
                key={i}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 block hover:border-brand/40 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge tone={n.category === "Crypto" ? "brand" : n.category === "Forex" ? "win" : "default"}>
                    {n.category}
                  </Badge>
                  <span className="text-xs text-muted">{n.source}</span>
                  {n.date && (
                    <span className="text-xs text-muted ml-auto">
                      {timeAgo(n.date)}
                    </span>
                  )}
                </div>
                <h3 className="font-medium group-hover:text-brand transition-colors flex items-start gap-1">
                  {n.title}
                  <ExternalLink size={13} className="mt-1 shrink-0 opacity-0 group-hover:opacity-60" />
                </h3>
                {n.summary && <p className="text-sm text-muted mt-1 line-clamp-2">{n.summary}</p>}
              </a>
            ))}

          {!loading && !error && !filtered.length && (
            <EmptyState title="No headlines in this category right now" />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="High-impact events" subtitle="Volatility you should respect" />
            <div className="space-y-3">
              {KEY_EVENTS.map((e) => (
                <div key={e.name} className="card p-3 bg-panel2/40">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={15} className="text-warn" />
                    <span className="font-medium text-sm">{e.name}</span>
                  </div>
                  <div className="text-xs text-muted mt-1.5">{e.when}</div>
                  <div className="text-xs mt-1">
                    <span className="text-muted">Moves: </span>
                    {e.impact}
                  </div>
                  <p className="text-xs text-muted mt-1">{e.note}</p>
                </div>
              ))}
            </div>
            <a
              href="https://www.forexfactory.com/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost w-full mt-3"
            >
              <ExternalLink size={14} /> Open live economic calendar
            </a>
          </Card>

          <Card>
            <SectionTitle title="Quick sources" />
            <div className="space-y-2 text-sm">
              {[
                ["TradingView", "https://www.tradingview.com/markets/"],
                ["Investing.com", "https://www.investing.com/"],
                ["Forex Factory", "https://www.forexfactory.com/"],
                ["CoinGecko", "https://www.coingecko.com/"],
              ].map(([label, url]) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-muted hover:text-brand"
                >
                  {label}
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function timeAgo(date: string): string {
  const t = Date.parse(date);
  if (!t) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
