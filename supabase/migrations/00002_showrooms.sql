-- Showrooms / dealer locations per brand. Used by the find_showrooms tool so
-- Rihla can list nearby concessions when the customer names a city.

create table if not exists public.showrooms (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,
  name            text not null,                    -- "Stafim Tunis Centre"
  city            text not null,                    -- "Casablanca"
  address         text,                              -- "Bd. Anfa, Casablanca 20000"
  phone           text,
  whatsapp        text,
  email           text,
  hours           text,                              -- "Mon–Sat 9am–7pm"
  lat             double precision,
  lng             double precision,
  service_centre  boolean not null default false,    -- has a workshop too
  primary_dealer  boolean not null default false,    -- highlighted in city
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists showrooms_brand_idx on public.showrooms(brand_id);
create index if not exists showrooms_city_idx on public.showrooms(brand_id, city);

-- Re-create the updated_at trigger using the helper from migration 00001.
drop trigger if exists trg_showrooms_touch on public.showrooms;
create trigger trg_showrooms_touch before update on public.showrooms
  for each row execute function public.touch_updated_at();

-- Service-role can do anything; anon can read enabled rows.
alter table public.showrooms enable row level security;
drop policy if exists showrooms_anon_read on public.showrooms;
create policy showrooms_anon_read on public.showrooms
  for select to anon, authenticated using (enabled = true);
drop policy if exists showrooms_service_all on public.showrooms;
create policy showrooms_service_all on public.showrooms
  for all to service_role using (true) with check (true);
