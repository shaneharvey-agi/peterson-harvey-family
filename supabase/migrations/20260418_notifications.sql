-- Notifications: Mikayla's proactive alerts for the household.
-- She writes rows here when she detects something worth surfacing
-- (conflicts, stale todos, missing dinner plans, timed reminders, etc.).
-- UI reads unread count + list; tapping an item marks it read.

create table if not exists public.notifications (
  id           bigserial primary key,
  kind         text not null,
  severity     text not null default 'info',
  title        text not null,
  body         text,
  action_url   text,
  action_label text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_unread_idx
  on public.notifications (created_at desc)
  where read_at is null;

comment on table public.notifications is
  'Proactive alerts surfaced by Mikayla. read_at null = unread.';
