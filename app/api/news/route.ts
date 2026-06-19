import { NextResponse } from "next/server";

export const revalidate = 600; // cache 10 min

/** Free, key-less finance/market RSS feeds. */
const FEEDS: { url: string; source: string; category: string }[] = [
  { url: "https://www.investing.com/rss/news_25.rss", source: "Investing.com", category: "Forex" },
  { url: "https://www.investing.com/rss/news_301.rss", source: "Investing.com", category: "Crypto" },
  { url: "https://www.investing.com/rss/news_95.rss", source: "Investing.com", category: "Economy" },
  { url: "https://www.fxstreet.com/rss/news", source: "FXStreet", category: "Forex" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk", category: "Crypto" },
];

interface NewsItem {
  title: string;
  link: string;
  date: string;
  source: string;
  category: string;
  summary: string;
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

function parseFeed(xml: string, source: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const b of blocks.slice(0, 12)) {
    const title = tag(b, "title");
    let link = tag(b, "link");
    if (!link) {
      const m = b.match(/<link[^>]*href="([^"]+)"/i);
      if (m) link = m[1];
    }
    if (!title) continue;
    items.push({
      title,
      link,
      date: tag(b, "pubDate") || tag(b, "published") || "",
      source,
      category,
      summary: tag(b, "description").slice(0, 240),
    });
  }
  return items;
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const res = await fetch(f.url, {
        headers: { "User-Agent": "Mozilla/5.0 QM-Cockpit" },
        next: { revalidate },
      });
      if (!res.ok) throw new Error(`${f.source} ${res.status}`);
      const xml = await res.text();
      return parseFeed(xml, f.source, f.category);
    })
  );

  let items: NewsItem[] = [];
  for (const r of results) if (r.status === "fulfilled") items = items.concat(r.value);

  items.sort((a, b) => {
    const ta = Date.parse(a.date) || 0;
    const tb = Date.parse(b.date) || 0;
    return tb - ta;
  });

  return NextResponse.json(
    { items: items.slice(0, 60), updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1200" } }
  );
}
