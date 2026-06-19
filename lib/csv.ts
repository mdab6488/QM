import { AssetClass, Direction, Emotion, Outcome, Trade } from "./types";

const HEADERS = [
  "date",
  "asset",
  "assetClass",
  "direction",
  "timeframe",
  "investment",
  "payoutPct",
  "outcome",
  "pnl",
  "followedPlan",
  "strategy",
  "emotionBefore",
  "emotionAfter",
  "confidence",
  "mistakes",
  "notes",
  "tags",
  "session",
];

function esc(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function tradesToCsv(trades: Trade[]): string {
  const lines = [HEADERS.join(",")];
  for (const t of trades) {
    lines.push(
      [
        t.date,
        t.asset,
        t.assetClass,
        t.direction,
        t.timeframe,
        t.investment,
        t.payoutPct,
        t.outcome,
        t.pnl,
        t.followedPlan,
        t.strategy,
        t.emotionBefore,
        t.emotionAfter,
        t.confidence,
        t.mistakes.join("|"),
        t.notes,
        t.tags.join("|"),
        t.session ?? "",
      ]
        .map(esc)
        .join(",")
    );
  }
  return lines.join("\n");
}

/** Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function csvToTrades(text: string): Omit<Trade, "id">[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const out: Omit<Trade, "id">[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (name: string) => {
      const i = idx(name);
      return i >= 0 ? row[i] ?? "" : "";
    };
    const investment = Number(get("investment")) || 0;
    const payoutPct = Number(get("payoutPct")) || 0;
    const outcome = (get("outcome").toUpperCase() as Outcome) || "WIN";
    let pnl = Number(get("pnl"));
    if (isNaN(pnl)) {
      pnl = outcome === "WIN" ? investment * (payoutPct / 100) : outcome === "LOSS" ? -investment : 0;
    }
    const date = get("date");
    out.push({
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      asset: get("asset") || "Unknown",
      assetClass: (get("assetClass") as AssetClass) || "Forex",
      direction: (get("direction").toUpperCase() as Direction) || "CALL",
      timeframe: get("timeframe") || "1m",
      investment,
      payoutPct,
      outcome,
      pnl,
      followedPlan: /true|yes|1/i.test(get("followedPlan")),
      strategy: get("strategy") || "—",
      emotionBefore: (get("emotionBefore") as Emotion) || "Calm",
      emotionAfter: (get("emotionAfter") as Emotion) || "Calm",
      confidence: Number(get("confidence")) || 3,
      mistakes: get("mistakes") ? get("mistakes").split("|").filter(Boolean) : [],
      notes: get("notes"),
      tags: get("tags") ? get("tags").split("|").filter(Boolean) : [],
      session: get("session") || undefined,
    });
  }
  return out;
}
