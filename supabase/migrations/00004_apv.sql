-- ─── APV (Après-Vente) — Round-4 ───────────────────────────────────────────
-- Two new tables to support the Stellantis after-sales workflow:
--   service_appointments  — RDV booking flow (Parcours 1)
--   complaints            — Réclamation flow (Parcours 3)
--
-- The KB / Info flow (Parcours 2) does NOT need a customer-data row — it's a
-- pure read-side. We'll add `kb_articles` in a separate migration when the
-- scrape lands.
--
-- Tables are shared across brands (brand_id FK) but the demo is gated to
-- jeep-ma only — the prompt + welcome only enable APV for that widget.

-- ─── Service appointments (RDV) ────────────────────────────────────────────
create type public.appointment_status as enum (
  'new',          -- created by chatbot, not yet contacted
  'qualified',    -- CRC reviewed and validated
  'assigned',     -- routed to a specific dealer
  'confirmed',    -- dealer reached the customer and locked the slot
  'completed',    -- intervention performed
  'cancelled'     -- customer cancelled / dealer rejected
);

create type public.intervention_type as enum (
  'mechanical',
  'bodywork'
);

create type public.appointment_slot as enum (
  'morning',
  'afternoon'
);

create table if not exists public.service_appointments (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  ref_number      text not null unique,                       -- 'RDV-2026-0427-001'

  -- Customer
  full_name       text not null,
  phone           text not null,                              -- normalized E.164ish
  email           text not null,

  -- Vehicle
  vehicle_brand   text not null,                              -- one of the Stellantis brands
  vehicle_model   text not null,
  vin             text not null,                              -- 17 chars, exclude I/O/Q

  -- Intervention
  intervention_type public.intervention_type not null,
  city            text not null,
  preferred_date  date not null,
  preferred_slot  public.appointment_slot not null,
  comment         text,

  -- Compliance
  cndp_consent_at timestamptz not null,
  source          text not null default 'chatbot',            -- 'chatbot' / 'crc' / future channels

  status          public.appointment_status not null default 'new',
  notes           text,                                       -- internal CRC notes
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_appts_brand on public.service_appointments(brand_id, created_at desc);
create index if not exists idx_appts_status on public.service_appointments(brand_id, status);
create index if not exists idx_appts_ref on public.service_appointments(ref_number);
create index if not exists idx_appts_vin on public.service_appointments(vin);

drop trigger if exists trg_appts_touch on public.service_appointments;
create trigger trg_appts_touch before update on public.service_appointments
  for each row execute function public.touch_updated_at();

alter table public.service_appointments enable row level security;
-- service-role only (no anon policy = anon blocked, matches existing tables)

-- ─── Complaints (Réclamation) ──────────────────────────────────────────────
create type public.complaint_status as enum (
  'new',
  'qualified',     -- CRC qualified (urgency / legitimacy / dedup)
  'assigned',      -- routed to concerned site
  'in_progress',   -- under treatment
  'resolved',
  'closed_no_resolution'
);

create table if not exists public.complaints (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  ref_number      text not null unique,                       -- 'REL-2026-0427-001'

  -- Customer
  full_name       text not null,
  phone           text not null,
  email           text not null,

  -- Vehicle
  vehicle_brand   text not null,
  vehicle_model   text not null,
  vin             text not null,

  -- Concerned intervention
  intervention_type public.intervention_type not null,
  site            text not null,                              -- atelier / city where the issue happened
  service_date    date,                                       -- date of the original intervention if known

  -- Reason
  reason          text not null,                              -- min 20 chars per spec
  attachment_url  text,                                       -- optional photo / doc

  -- Compliance
  cndp_consent_at timestamptz not null,
  source          text not null default 'chatbot',

  status          public.complaint_status not null default 'new',
  crc_notes       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_complaints_brand on public.complaints(brand_id, created_at desc);
create index if not exists idx_complaints_status on public.complaints(brand_id, status);
create index if not exists idx_complaints_ref on public.complaints(ref_number);
create index if not exists idx_complaints_vin on public.complaints(vin);

drop trigger if exists trg_complaints_touch on public.complaints;
create trigger trg_complaints_touch before update on public.complaints
  for each row execute function public.touch_updated_at();

alter table public.complaints enable row level security;
