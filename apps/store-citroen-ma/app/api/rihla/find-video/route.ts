// /api/rihla/find-video?q=peugeot+5008&brand=peugeot-ksa
//
// Resolves a customer-facing model query to a real YouTube video the chat
// can EMBED inline. Uses YouTube Data API v3 with the existing GOOGLE_API_KEY
// (Gemini key — must have YouTube Data API enabled in the Google Cloud
// project). Falls back to a search-results URL when the API isn't enabled
// or returns no results.
//
// Cached for 24h per query to avoid burning quota on repeat asks.

import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CacheEntry = { videoId: string | null; title?: string; cachedAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const brand = (url.searchParams.get("brand") ?? "").trim();
  if (!q) return Response.json({ videoId: null, query: q, fallbackUrl: null });

  const cacheKey = `${brand}::${q.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return Response.json({
      videoId: cached.videoId,
      title: cached.title,
      query: q,
      embedUrl: cached.videoId ? embedUrl(cached.videoId) : null,
      fallbackUrl: youtubeSearchUrl(q),
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json({
      videoId: null,
      query: q,
      embedUrl: null,
      fallbackUrl: youtubeSearchUrl(q),
    });
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q,
      type: "video",
      maxResults: "1",
      videoEmbeddable: "true",
      relevanceLanguage: "en",
      safeSearch: "moderate",
      key: apiKey,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      // YouTube quota is per-day; this is fine to call from the server.
      cache: "no-store",
    });
    if (!res.ok) {
      cache.set(cacheKey, { videoId: null, cachedAt: Date.now() });
      return Response.json({
        videoId: null,
        query: q,
        embedUrl: null,
        fallbackUrl: youtubeSearchUrl(q),
      });
    }
    const json = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string };
      }>;
    };
    const first = json.items?.[0];
    const videoId = first?.id?.videoId ?? null;
    const title = first?.snippet?.title;
    cache.set(cacheKey, { videoId, title, cachedAt: Date.now() });
    return Response.json({
      videoId,
      title,
      query: q,
      embedUrl: videoId ? embedUrl(videoId) : null,
      fallbackUrl: youtubeSearchUrl(q),
    });
  } catch (err) {
    console.warn("[find-video] failed:", (err as Error).message?.slice(0, 100));
    return Response.json({
      videoId: null,
      query: q,
      embedUrl: null,
      fallbackUrl: youtubeSearchUrl(q),
    });
  }
}

function embedUrl(videoId: string): string {
  // youtube-nocookie + modestbranding for a cleaner in-chat experience.
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?modestbranding=1&rel=0`;
}

function youtubeSearchUrl(q: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
