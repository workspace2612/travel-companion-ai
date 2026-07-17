// Keyless web search + page-reader helpers.
// - Prefers Tavily when TAVILY_API_KEY is set (best quality + snippets).
// - Falls back to DuckDuckGo HTML for result links (no key needed).
// - Uses r.jina.ai reader proxy to fetch clean page text (no key needed).

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(query: string, max = 5): Promise<WebResult[]> {
  const tavily = process.env.TAVILY_API_KEY;
  if (tavily) {
    try {
      const r = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavily,
          query,
          max_results: max,
          search_depth: "basic",
        }),
      });
      if (r.ok) {
        const j = (await r.json()) as {
          results?: Array<{ title: string; url: string; content: string }>;
        };
        return (j.results ?? []).slice(0, max).map((x) => ({
          title: x.title,
          url: x.url,
          snippet: x.content,
        }));
      }
    } catch {
      /* fall through to DDG */
    }
  }
  // DuckDuckGo HTML — keyless
  const r = await fetch(
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      },
    },
  );
  const html = await r.text();
  const results: WebResult[] = [];
  const re =
    /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && results.length < max) {
    let url = m[1];
    // DDG wraps URLs like /l/?uddg=<encoded>
    const uddg = url.match(/uddg=([^&]+)/);
    if (uddg) url = decodeURIComponent(uddg[1]);
    const strip = (s: string) =>
      s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    results.push({
      url,
      title: strip(m[2]),
      snippet: strip(m[3]),
    });
  }
  return results;
}

export async function readPage(url: string, maxChars = 6000): Promise<string> {
  // r.jina.ai returns clean markdown of any URL, no key required.
  try {
    const r = await fetch(`https://r.jina.ai/${url}`, {
      headers: { "User-Agent": "Mozilla/5.0 TripCopilot" },
    });
    if (r.ok) {
      const t = await r.text();
      return t.slice(0, maxChars);
    }
  } catch {
    /* fall through */
  }
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 TripCopilot" },
  });
  const html = await r.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}
