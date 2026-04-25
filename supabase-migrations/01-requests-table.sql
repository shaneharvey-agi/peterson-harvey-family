-- Build Session 1.8 — outbound "Request" feature
-- Run in Supabase SQL editor on the Mikayla project.

create table if not exists public.requests (
  id          bigserial primary key,
  from_id     text not null,
  to_id       text not null,
  content     text not null,
  status      text not null default 'pending' check (status in ('pending', 'complete')),
  priority    text not null default 'normal'  check (priority in ('low', 'normal', 'high')),
  created_at  timestamptz not null default now(),
  completed_at timestamptz
);

-- Hot path: pending count per recipient for the home-screen badge.
create index if not exists requests_to_id_pending_idx
  on public.requests (to_id)
  where status = 'pending';

-- Optional: open RLS so the anon key the Next.js app uses can read/write.
-- Tighten these once auth lands.
alter table public.requests enable row level security;

drop policy if exists "requests_anon_read" on public.requests;
create policy "requests_anon_read"
  on public.requests for select
  using (true);

drop policy if exists "requests_anon_insert" on public.requests;
create policy "requests_anon_insert"
  on public.requests for insert
  with check (true);

drop policy if exists "requests_anon_update_status" on public.requests;
create policy "requests_anon_update_status"
  on public.requests for update
  using (true)
  with check (true);
