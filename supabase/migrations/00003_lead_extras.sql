-- ─── Round-3 lead extras ───────────────────────────────────────────────────
-- 1. Capture the dealer the customer booked with (showroom_name) — currently
--    lost when the customer picks a specific showroom from the find_showrooms
--    list. Mirrored in `leads` (dealer-facing record) and `conversations`
--    (admin transcript view's lead summary).
-- 2. Per-conversation message sequence number — gives deterministic ordering
--    in the admin transcript when multiple rows land in the same millisecond
--    (which is what was making messages appear out of order). Existing rows
--    default to 0; new rows get the next value via the trigger below.

alter table public.leads
  add column if not exists showroom_name  text;

alter table public.conversations
  add column if not exists lead_showroom  text;

alter table public.messages
  add column if not exists seq integer not null default 0;

create index if not exists idx_messages_conv_seq on public.messages(conversation_id, seq);

create or replace function public.assign_message_seq()
returns trigger language plpgsql as $$
declare
  next_seq int;
begin
  if NEW.seq is null or NEW.seq = 0 then
    select coalesce(max(seq), 0) + 1
      into next_seq
      from public.messages
      where conversation_id = NEW.conversation_id;
    NEW.seq := next_seq;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_messages_assign_seq on public.messages;
create trigger trg_messages_assign_seq
  before insert on public.messages
  for each row execute function public.assign_message_seq();
