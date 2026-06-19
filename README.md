# QM Trading Cockpit

A personal, production-ready **trading analysis, journaling, psychology and news** system
built for traders on [market-qx.trade](https://market-qx.trade) (Quotex-style binary/options).

It replaces and massively extends the original `QX.xlsx` session tracker.

## What it does

| Area | What you get |
|------|--------------|
| **Dashboard** | Live equity curve, net P&L, win rate, profit factor, discipline score, daily risk guardrails, auto-generated coaching insights. |
| **Trade Journal** | Full CRUD on trades (asset, direction, stake, payout, outcome, emotion, mistakes, notes). Auto P&L from payout %. CSV import/export. Search & filter. |
| **Analytics** | Breakdowns by asset, strategy, hour of day, weekday, emotion, asset class, and direction. Finds your edge and your leaks. |
| **Psychology** | Daily mind check-ins (sleep/stress/energy/mood), trading-rules contract, revenge-trade & tilt detection, "emotion → money" map. |
| **News & Calendar** | Live, key-less market news (Forex / Crypto / Economy via RSS) + a high-impact economic-events watchlist. |
| **Settings** | Account, risk guardrails, sample-data loader, full JSON backup, reset. |

## Honesty about "prediction"

No tool can reliably predict market direction. This cockpit gives you the **real** edge:
a disciplined record of *your own* behaviour plus timely awareness of market-moving events.
The news feed is framed as a **volatility warning system**, not a crystal ball.

## Tech

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **Recharts** for charts
- **Zustand** + `localStorage` for **local-first** persistence (your data never leaves your browser)
- One server route (`/api/news`) aggregates public finance RSS feeds (cached 10 min)

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

First run is empty — click **Load sample QX data** (Dashboard or Settings) to explore with
the reconstructed S1–S7 sessions from your spreadsheet, or just start logging real trades.

## Build

```bash
npm run build
npm start
```

## Deploy (Vercel — recommended)

1. Push this folder to a GitHub repo.
2. Import it at [vercel.com/new](https://vercel.com/new) — Next.js is auto-detected, no config needed.
3. Deploy. That's it. (No database or environment variables required.)

Or from the CLI:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

> Because storage is local-first, each browser/device holds its own journal.
> Use **Settings → Backup all data (JSON)** to move data between devices, and back up regularly.

## Data & privacy

- 100% client-side storage (`localStorage`, key `qm-trading-cockpit`).
- The only network call is the server-side news fetch (public RSS, no keys, no personal data).

## Roadmap ideas

- Multi-device sync via an optional database (Vercel Postgres / Neon).
- Screenshot attachments per trade.
- Auth + cloud backup.
- Optional economic-calendar API (Finnhub / Trading Economics) behind an env var.
