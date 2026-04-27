-- public.memories
-- Brain-dump bucket for the M Orb intent router. When Haiku classifies a
-- voice transcript as "brain_dump" (anything that's not a message, request,
-- chore, or filter), the cleaned content lands here so it's never lost.
create table if not exists public.memories (
  id           bigserial primary key,
  author       text        not null default 'shane',
  content      text        not null,
  source       text        not null default 'voice',
  created_at   timestamptz not null default now()
);

create index if not exists memories_created_at_idx
  on public.memories (created_at desc);

alter table public.memories enable row level security;

drop policy if exists "memories_select_anon" on public.memories;
create policy "memories_select_anon"
  on public.memories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "memories_insert_anon" on public.memories;
create policy "memories_insert_anon"
  on public.memories
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "memories_update_anon" on public.memories;
create policy "memories_update_anon"
  on public.memories
  for update
  to anon, authenticated
  using (true)
  with check (true);

comment on table public.memories is
  'Brain-dump entries from M Orb voice intake when intent does not match message/request/chore/filter.';
