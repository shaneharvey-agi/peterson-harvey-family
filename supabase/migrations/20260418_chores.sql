-- Chores: kid-assigned tasks authored by a parent.
-- Distinct from `todos` (shared household). A chore always has an
-- assignee (a family member) and a created_by (the parent who set it).
-- Mikayla writes rows here when Shane presses-and-holds to dictate:
-- "give Jax the trash tonight".

create table if not exists public.chores (
  id          bigserial primary key,
  assignee    text not null,
  title       text not null,
  due_date    date,
  done_at     timestamptz,
  created_by  text,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists chores_open_idx
  on public.chores (due_date nulls last, created_at desc)
  where done_at is null;

create index if not exists chores_assignee_idx
  on public.chores (assignee);

comment on table public.chores is
  'Kid-assigned chores authored by a parent. done_at null = open.';
