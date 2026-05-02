// Character-based text chunker with overlap + sentence-boundary preference.
// Each KB stores its own chunk_size + chunk_overlap (configurable from the
// admin UI); we use those values at ingest time.
//
// Strategy:
//  1. Walk the text in `chunkSize` strides
//  2. Within each stride, look for a clean break point (paragraph > sentence)
//     in the LAST 40% of the chunk; if found, end the chunk there
//  3. Start the NEXT chunk `overlap` chars before the end of the current one
//  4. Collapse runs of whitespace, drop empty chunks
//
// Not as smart as a proper sentence/Markdown-aware splitter — but small,
// dependency-free, and good enough for the 800-char default.

const BOUNDARY_WINDOW = 0.4; // search the LAST 40 % of the chunk for a break

export type Chunk = {
  index: number;
  content: string;
  /** Estimated GPT-style token count (1 token ≈ 4 chars in Latin scripts).
   *  Useful for analytics / cost tracking; not used by retrieval. */
  tokens: number;
};

export function chunkText(
  text: string,
  chunkSize: number = 800,
  overlap: number = 200
): Chunk[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/ /g, " ").trim();
  if (cleaned.length === 0) return [];
  if (overlap >= chunkSize) overlap = Math.floor(chunkSize / 4);

  if (cleaned.length <= chunkSize) {
    return [{ index: 0, content: cleaned, tokens: estimateTokens(cleaned) }];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let idx = 0;
  const minBoundary = Math.floor(chunkSize * (1 - BOUNDARY_WINDOW));

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // If we're not at the very end, try to break on a clean boundary.
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const candidates = [
        slice.lastIndexOf("\n\n"),     // paragraph break — best
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf(". "),       // sentence end
        slice.lastIndexOf("\n"),       // line break — fallback
      ].filter((p) => p >= minBoundary);
      const best = Math.max(...candidates, -1);
      if (best > 0) end = start + best + 1;
    }

    const content = cleaned.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({ index: idx++, content, tokens: estimateTokens(content) });
    }
    if (end >= cleaned.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

/** Cheap token estimate — Latin scripts ≈ 1 token / 4 chars; Arabic / CJK
 *  end up closer to 1 token / 2 chars but that's a separate calibration. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
