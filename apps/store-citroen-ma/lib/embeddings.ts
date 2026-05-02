// Gemini text-embedding-004 wrapper.
// 768-dimensional vectors, free-tier limits (1500 RPM, 60K tok/min).
// Two task types matter at retrieval time:
//   RETRIEVAL_DOCUMENT — for chunks we STORE (Phase 2 ingest)
//   RETRIEVAL_QUERY    — for the user's question at chat time (Phase 3)
// Using mismatched task types still works but degrades top-K relevance.

const MODEL = "text-embedding-004";
const DIM = 768;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

// Gemini's batchEmbedContents accepts up to ~100 requests per call. Stay
// well under to avoid 413s on long chunks.
const MAX_BATCH = 100;

export const EMBEDDING_DIM = DIM;
export const EMBEDDING_MODEL = MODEL;

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

function apiKey(): string {
  const k = process.env.GOOGLE_API_KEY;
  if (!k) throw new Error("GOOGLE_API_KEY not set — required for Gemini embeddings");
  return k;
}

/** Embed a single piece of text. Use for the user query at retrieval time. */
export async function embedQuery(text: string): Promise<number[]> {
  const url = `${ENDPOINT}/models/${MODEL}:embedContent?key=${apiKey()}`;
  const body = {
    model: `models/${MODEL}`,
    content: { parts: [{ text }] },
    taskType: "RETRIEVAL_QUERY" satisfies EmbeddingTaskType,
  };
  const data = await postWithRetry<{ embedding: { values: number[] } }>(url, body);
  return data.embedding.values;
}

/** Embed many texts at once. Use for chunks at ingest time. Splits into
 *  batches automatically; preserves input order in the returned array. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const url = `${ENDPOINT}/models/${MODEL}:batchEmbedContents?key=${apiKey()}`;
  const out: number[][] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const body = {
      requests: batch.map((text) => ({
        model: `models/${MODEL}`,
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT" satisfies EmbeddingTaskType,
      })),
    };
    const data = await postWithRetry<{ embeddings: { values: number[] }[] }>(url, body);
    for (let j = 0; j < batch.length; j++) {
      const v = data.embeddings[j]?.values;
      if (!v) throw new Error(`Gemini embed: missing embedding for batch index ${j}`);
      if (v.length !== DIM) throw new Error(`Gemini embed: expected ${DIM} dims, got ${v.length}`);
      out[i + j] = v;
    }
  }

  return out;
}

/** pgvector accepts vectors as strings: '[0.1, 0.2, …]'. Use this when
 *  inserting a number[] embedding via supabase-js (no native vector type). */
export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/* ─────────────────── Internal: POST with light retry ─────────────────── */

async function postWithRetry<T>(url: string, body: unknown, attempt = 0): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt < 3) {
      // Exponential backoff: 500 ms, 1.5 s, 4.5 s.
      const wait = 500 * Math.pow(3, attempt);
      await new Promise((r) => setTimeout(r, wait));
      return postWithRetry<T>(url, body, attempt + 1);
    }
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embed failed (${res.status}): ${errText.slice(0, 240)}`);
  }

  return (await res.json()) as T;
}
