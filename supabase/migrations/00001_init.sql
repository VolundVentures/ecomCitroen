-- ─── Brands ─────────────────────────────────────────────────────────────────
-- Each brand drives a separate widget (jeep-ma, citroen-ma, peugeot-ksa).
create table if not exists public.brands (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,                     -- 'jeep-ma'
  name            text not null,                            -- 'Jeep Maroc'
  homepage_url    text not null,                            -- 'https://www.jeep.com/ma/index.html'
  market          text not null,                            -- 'MA' / 'SA'
  default_currency text not null,                           -- 'MAD' / 'SAR'
  locales         text[] not null,                          -- ['fr-MA','ar-MA','darija-MA']
  primary_color   text,                                     -- '#1a1a1a' for theming
  logo_url        text,                                     -- '/brands/jeep-ma/logo.svg'
  voice_name      text not null default 'Zephyr',           -- Gemini voice
  agent_name      text not null default 'Rihla',
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Models ─────────────────────────────────────────────────────────────────
-- Vehicles per brand. Used by the agent to recommend + show inline images.
create table if not exists public.models (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,
  slug            text not null,                            -- 'wrangler', 'c3-aircross'
  name            text not null,                            -- 'Wrangler', 'C3 Aircross'
  tagline         text,
  description     text,
  body_type       text,                                     -- 'SUV', 'Hatchback', etc.
  price_from      numeric(12,2),
  currency        text,
  fuel            text,
  transmission    text,
  seats           int,
  hero_image_url  text not null,                            -- canonical hero
  gallery_images  text[] not null default '{}',             -- additional photos
  key_features    text[] not null default '{}',
  specs           jsonb not null default '{}'::jsonb,
  page_url        text not null,                            -- canonical brand-site URL
  display_order   int not null default 100,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (brand_id, slug)
);
create index if not exists idx_models_brand on public.models(brand_id) where enabled;

-- ─── Prompt versions ────────────────────────────────────────────────────────
-- Versioned system prompts per brand. The latest version with is_active = true
-- is what the agent uses at runtime.
create table if not exists public.prompts (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,
  version         int not null,                             -- monotonic per brand
  body            text not null,                            -- the full system prompt
  is_active       boolean not null default false,
  notes           text,                                     -- editor's note about the change
  edited_by       text,                                     -- email or 'system'
  created_at      timestamptz not null default now(),
  unique (brand_id, version)
);
create index if not exists idx_prompts_active on public.prompts(brand_id, is_active) where is_active;

-- ─── Conversations ──────────────────────────────────────────────────────────
create type public.conversation_status as enum ('open', 'closed_lead', 'closed_no_lead', 'abandoned');

create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,
  prompt_id       uuid references public.prompts(id) on delete set null,
  locale          text not null,                            -- 'fr-MA' / 'ar-MA' / 'darija-MA' / 'en-MA'
  channel         text not null,                            -- 'chat' or 'voice'
  status          public.conversation_status not null default 'open',
  -- Funnel checkpoints — set when the corresponding info is captured.
  reached_usage      timestamptz,
  reached_budget     timestamptz,
  reached_recommendation timestamptz,
  captured_name      timestamptz,
  captured_phone     timestamptz,
  captured_city      timestamptz,
  captured_slot      timestamptz,
  booked_test_drive  timestamptz,
  -- Lead data captured during the flow (also normalized in `leads` table).
  lead_name       text,
  lead_phone      text,
  lead_city       text,
  lead_slot       text,
  lead_model_slug text,
  ip_country      text,
  user_agent      text,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  duration_seconds int generated always as (
    case when ended_at is not null then extract(epoch from (ended_at - started_at))::int else null end
  ) stored
);
create index if not exists idx_conv_brand_started on public.conversations(brand_id, started_at desc);
create index if not exists idx_conv_status on public.conversations(brand_id, status);

-- ─── Messages ───────────────────────────────────────────────────────────────
create type public.message_role as enum ('user', 'assistant', 'system');
create type public.message_kind as enum ('text', 'image_card', 'tool_use');

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            public.message_role not null,
  kind            public.message_kind not null default 'text',
  content         text,                                     -- text body (null for tool_use)
  -- For image_card and tool_use, payload carries structured data:
  --   image_card: { imageUrl, caption, ctaLabel, ctaUrl, modelSlug }
  --   tool_use:   { name, input, output? }
  payload         jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_messages_conv on public.messages(conversation_id, created_at);

-- ─── Tool calls ─────────────────────────────────────────────────────────────
-- Denormalized view of tool invocations for analytics. Mirrors a subset of `messages`
-- but is queryable directly without unpacking JSON.
create table if not exists public.tool_calls (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id      uuid references public.messages(id) on delete cascade,
  name            text not null,                            -- 'open_model', 'book_test_drive', ...
  input           jsonb not null default '{}'::jsonb,
  result          jsonb,
  succeeded       boolean,
  created_at      timestamptz not null default now()
);
create index if not exists idx_toolcalls_conv on public.tool_calls(conversation_id, created_at);
create index if not exists idx_toolcalls_name on public.tool_calls(name, created_at desc);

-- ─── Events ─────────────────────────────────────────────────────────────────
-- Generic analytics events — page loads, CTAs, drop-offs.
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  brand_id        uuid references public.brands(id) on delete cascade,
  name            text not null,                            -- 'widget_opened', 'voice_started', etc.
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_events_brand_name on public.events(brand_id, name, created_at desc);
create index if not exists idx_events_conv on public.events(conversation_id, created_at);

-- ─── Leads ──────────────────────────────────────────────────────────────────
-- Normalized lead records (what the dealer actually receives).
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  model_slug      text not null,
  first_name      text not null,
  phone           text not null,
  city            text,
  preferred_slot  text,
  notes           text,
  status          text not null default 'new',              -- 'new' / 'contacted' / 'closed'
  created_at      timestamptz not null default now()
);
create index if not exists idx_leads_brand on public.leads(brand_id, created_at desc);
create index if not exists idx_leads_status on public.leads(brand_id, status);

-- ─── updated_at triggers ────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_brands_touch on public.brands;
create trigger trg_brands_touch before update on public.brands
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_models_touch on public.models;
create trigger trg_models_touch before update on public.models
  for each row execute function public.touch_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Row Level Security: lock everything down. The browser uses the anon key only
-- to read brand + model catalogs (public-facing widget data). All writes and
-- analytics reads go through server routes using the service-role key.
alter table public.brands           enable row level security;
alter table public.models           enable row level security;
alter table public.prompts          enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;
alter table public.tool_calls       enable row level security;
alter table public.events           enable row level security;
alter table public.leads            enable row level security;

-- Public read of enabled brands + models for the widget.
drop policy if exists "anon read enabled brands" on public.brands;
create policy "anon read enabled brands" on public.brands
  for select using (enabled = true);

drop policy if exists "anon read enabled models" on public.models;
create policy "anon read enabled models" on public.models
  for select using (enabled = true);

-- Everything else: service-role only (no anon policy = anon blocked).
