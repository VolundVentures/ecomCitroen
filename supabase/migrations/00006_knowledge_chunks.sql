-- ─── Knowledge Chunks (RAG) — Phase 2 ───────────────────────────────────────
-- Vector embeddings + similarity search for the RAG pipeline.
--
-- Embeddings: Gemini `text-embedding-004` → 768-dimensional vectors.
-- Distance:   cosine similarity (the operator in pgvector is `<=>`).
-- Index:      ivfflat with `vector_cosine_ops` (default lists=100 — works
--             well up to ~1M chunks; bump if a single brand grows past that).
--
-- Re-running this migration is safe: every statement is idempotent.

create extension if not exists vector;

-- ─── Chunks table ──────────────────────────────────────────────────────────
create table if not exists public.knowledge_chunks (
  id              uuid primary key default gen_random_uuid(),

  -- Both kb_id and document_id are stored so we can filter by either without
  -- joining: the typical query is "all ready chunks in KB X" which only needs
  -- kb_id, while the admin UI ("count chunks per doc") only needs doc_id.
  document_id     uuid not null references public.knowledge_documents(id) on delete cascade,
  kb_id           uuid not null references public.knowledge_bases(id)     on delete cascade,

  chunk_index     int  not null,
  content         text not null,
  embedding       vector(768),
  tokens          int  not null default 0,

  created_at      timestamptz not null default now(),

  unique (document_id, chunk_index)
);

create index if not exists idx_chunks_kb        on public.knowledge_chunks(kb_id);
create index if not exists idx_chunks_doc       on public.knowledge_chunks(document_id);

-- ANN index for fast cosine similarity. ivfflat needs `analyze` on the table
-- to actually be used by the planner — Supabase auto-runs it post-migration.
create index if not exists idx_chunks_embedding
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ─── Similarity search RPC ─────────────────────────────────────────────────
-- Called from the chat / voice routes at query time (Phase 3). Returns
-- top-K most similar chunks for a given KB, joined with the doc name so
-- the model can cite the source if asked.
create or replace function public.match_kb_chunks(
  p_kb_id           uuid,
  p_query_embedding vector(768),
  p_top_k           int default 5
)
returns table (
  id              uuid,
  document_id     uuid,
  document_name   text,
  chunk_index     int,
  content         text,
  similarity      float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    d.name              as document_name,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.knowledge_chunks c
  join public.knowledge_documents d on d.id = c.document_id
  where c.kb_id = p_kb_id
    and c.embedding is not null
  order by c.embedding <=> p_query_embedding
  limit p_top_k;
$$;

-- Multi-KB variant — used when a brand has several KBs attached and we want
-- the top-K across all of them ranked together. Phase 3 will use this for
-- brand-scoped retrieval.
create or replace function public.match_brand_chunks(
  p_brand_id        uuid,
  p_query_embedding vector(768),
  p_top_k           int default 5
)
returns table (
  id              uuid,
  document_id     uuid,
  document_name   text,
  kb_id           uuid,
  kb_name         text,
  chunk_index     int,
  content         text,
  similarity      float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    d.name              as document_name,
    c.kb_id,
    k.name              as kb_name,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.knowledge_chunks c
  join public.knowledge_documents d on d.id = c.document_id
  join public.knowledge_bases     k on k.id = c.kb_id
  where k.brand_id = p_brand_id
    and k.enabled  = true
    and c.embedding is not null
  order by c.embedding <=> p_query_embedding
  limit p_top_k;
$$;
