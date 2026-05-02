-- ─── Knowledge Bases (RAG) — Phase 1 ───────────────────────────────────────
-- Per-brand knowledge bases that the agent will retrieve from at chat /
-- voice time. Phase 1 stores raw extracted text only — no embeddings yet.
-- Phase 2 will add `knowledge_chunks` with a pgvector column and the embed
-- pipeline (Gemini text-embedding-004, 768 dim).
--
-- Storage layout:
--   `knowledge-base` Storage bucket  →  files at <brand_slug>/<kb_id>/<doc_id>-<filename>
--   `knowledge_documents.raw_text`  →  extracted plain text (used for retrieval)
--   `knowledge_documents.storage_path` → original file pointer (for re-extraction)

-- ─── Knowledge bases ───────────────────────────────────────────────────────
create table if not exists public.knowledge_bases (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,

  name            text not null,
  description     text,

  -- Retrieval settings — applied at query time in Phase 3.
  top_k           int  not null default 5    check (top_k between 1 and 20),
  chunk_size      int  not null default 800  check (chunk_size between 200 and 4000),
  chunk_overlap   int  not null default 200  check (chunk_overlap between 0 and 1000),

  enabled         boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (brand_id, name)
);

create index if not exists idx_kb_brand     on public.knowledge_bases(brand_id);
create index if not exists idx_kb_enabled   on public.knowledge_bases(enabled);

-- ─── Documents (data sources) ──────────────────────────────────────────────
-- Postgres doesn't support `CREATE TYPE ... IF NOT EXISTS` for enums, so we
-- guard with pg_type lookups — lets us re-run this file safely (Supabase
-- `db push` retries every migration when the previous run partially failed).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'kb_source_type') then
    create type public.kb_source_type as enum ('file', 'url', 'text');
  end if;
  if not exists (select 1 from pg_type where typname = 'kb_doc_status') then
    create type public.kb_doc_status as enum (
      'pending',     -- row created, raw text not yet extracted
      'processing',  -- extraction in progress (Phase 2 will add 'embedding')
      'ready',       -- raw_text populated, available for retrieval
      'failed'       -- extraction error — see error_message
    );
  end if;
end$$;

create table if not exists public.knowledge_documents (
  id              uuid primary key default gen_random_uuid(),
  kb_id           uuid not null references public.knowledge_bases(id) on delete cascade,

  name            text not null,
  source_type     public.kb_source_type not null,

  -- Source pointers — exactly ONE of these is non-null per row:
  storage_path    text,    -- 'jeep-ma/<kb_id>/<doc_id>-spec-sheet.pdf'  (source_type='file')
  source_url      text,    -- 'https://www.jeep.ma/wrangler.html'          (source_type='url')

  mime_type       text,
  size_bytes      bigint not null default 0,

  -- Extracted plain text used for chunking + retrieval. Stored in DB so we
  -- don't re-fetch / re-parse the original on every chat turn.
  raw_text        text,

  status          public.kb_doc_status not null default 'pending',
  error_message   text,

  metadata        jsonb not null default '{}'::jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_kbdoc_kb     on public.knowledge_documents(kb_id);
create index if not exists idx_kbdoc_status on public.knowledge_documents(status);

-- ─── updated_at triggers ───────────────────────────────────────────────────
create or replace function public.touch_kb_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kb_touch on public.knowledge_bases;
create trigger trg_kb_touch
  before update on public.knowledge_bases
  for each row execute function public.touch_kb_updated_at();

drop trigger if exists trg_kbdoc_touch on public.knowledge_documents;
create trigger trg_kbdoc_touch
  before update on public.knowledge_documents
  for each row execute function public.touch_kb_updated_at();

-- ─── Storage bucket ────────────────────────────────────────────────────────
-- Private bucket (admin-uploads only, agent reads via service role).
-- `allowed_mime_types = NULL` means "accept anything" — we validate types in
-- the server action `uploadDocument()` instead, which is more flexible than
-- the bucket-level whitelist (and avoids the octet-stream rejection some
-- browsers cause for .md / .txt files).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge-base',
  'knowledge-base',
  false,
  15 * 1024 * 1024,           -- 15 MB per file (matches Gallabox UX)
  null
)
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
