# QM Money Management

A personal, production-ready **money-management, session and psychology** system
built for traders on [market-qx.trade](https://market-qx.trade) (Quotex-style binary/options).

It replaces and massively extends the original `QX.xlsx` session tracker.

## What it does

| Area | What you get |
|------|--------------|
| **Money Management** | Goal-based **groups** (deposit a starting amount, e.g. $250, and trade toward a goal, e.g. $30,000). Each group holds **sessions** (bankroll ladders modeled on the QX sheets: capital → plan → entries → net P&L), supports **deposit/withdraw**, a cash-flow ledger, and **funding a new group by withdrawing from an existing one**. |
| **Psychology** | Daily mind check-ins (sleep/stress/energy/mood), trading-rules contract, revenge-trade & tilt detection, "emotion → money" map. |
| **News & Calendar** | Live, key-less market news (Forex / Crypto / Economy via RSS) + a high-impact economic-events watchlist. |
| **Settings** | Account profile and risk guardrails. |

## Tech

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **Supabase** (Postgres + Auth) for cloud storage, secured per-user with Row Level Security
- **Zustand** for in-memory state; the whole app state is persisted as one JSON document per user
- One server route (`/api/news`) aggregates public finance RSS feeds (cached 10 min)

## Setup

### 1. Create a Supabase project

At [supabase.com](https://supabase.com), create a project. Then in **Settings → API** copy:
- the **Project URL**
- the **anon public** key

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run the database migration

In the Supabase dashboard, open **SQL Editor** and run the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). It creates the
`app_state` table and the Row Level Security policies that scope each row to its owner.

### 4. Enable Google sign-in

Auth is **Google-only**. Set it up once:

1. In **Google Cloud Console** → APIs & Services → Credentials, create an **OAuth 2.0 Client ID**
   (type: Web application). Under **Authorized redirect URIs** add your Supabase callback:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. Copy the **Client ID** and **Client secret**.
2. In **Supabase → Authentication → Providers → Google**, enable it and paste the Client ID/secret.
3. In **Supabase → Authentication → URL Configuration**, add your app's callback URLs to
   **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-DOMAIN/auth/callback`

   and set **Site URL** to your deployed domain.

### 5. Run locally

```bash
npm install
npm run dev
# open http://localhost:3000  → you'll be sent to /login
```

Click **Continue with Google** (which creates your account on first sign-in), then add your
first group on the **Money Management** page.

## Build

```bash
npm run build
npm start
```

## Deploy (Vercel — recommended)

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — Next.js is auto-detected.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel project settings.
4. Deploy.

## Data & privacy

- Your data lives in **your** Supabase project, isolated per user via Row Level Security.
- The only third-party network call is the server-side news fetch (public RSS, no keys, no personal data).
