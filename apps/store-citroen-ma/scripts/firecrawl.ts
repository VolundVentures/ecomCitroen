// Thin Firecrawl v1 client. We don't pull the SDK to avoid lockfile churn.
// https://docs.firecrawl.dev/api-reference

const API = "https://api.firecrawl.dev/v2";

function key(): string {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error("FIRECRAWL_API_KEY missing in env");
  return k;
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl ${path} ${res.status}: ${text.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

export type MapResult = {
  success: boolean;
  links?: string[];
};

export async function mapSite(url: string, search?: string): Promise<string[]> {
  const r = await call<{ success: boolean; links?: Array<string | { url: string }> }>("/map", {
    url,
    ...(search ? { search } : {}),
    limit: 200,
    timeout: 60_000,
  });
  // v2 may return objects {url, title}; normalize to plain strings.
  const list = r.links ?? [];
  return list.map((l) => (typeof l === "string" ? l : l.url)).filter(Boolean);
}

export type ScrapeResult = {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: Record<string, unknown>;
    links?: string[];
    extract?: unknown;
    json?: unknown;
  };
};

/** Scrape a single page and return markdown + extracted JSON shaped by the schema. */
export async function scrapeWithSchema<T>(
  url: string,
  schema: Record<string, unknown>,
  prompt?: string
): Promise<{ markdown: string; data: T | null; links: string[] }> {
  const r = await call<ScrapeResult>("/scrape", {
    url,
    formats: ["markdown", "links", { type: "json", schema, prompt }],
    onlyMainContent: false,
    waitFor: 2500,
    timeout: 90_000,
  });
  return {
    markdown: r.data?.markdown ?? "",
    data: ((r.data?.json ?? r.data?.extract) as T | undefined) ?? null,
    links: r.data?.links ?? [],
  };
}

/** Scrape and just return raw markdown + the rendered link list. */
export async function scrapeMarkdown(url: string): Promise<{ markdown: string; links: string[] }> {
  const r = await call<ScrapeResult>("/scrape", {
    url,
    formats: ["markdown", "links"],
    onlyMainContent: false,
    waitFor: 3000,
    timeout: 60_000,
  });
  return { markdown: r.data?.markdown ?? "", links: r.data?.links ?? [] };
}
