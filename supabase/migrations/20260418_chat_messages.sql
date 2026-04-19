-- Chat messages: the actual threaded conversations surface.
-- Distinct from the home-feed `messages` carousel cards (briefs/urgents/
-- meal hints) — those live in a different shape. Threads here are the
-- SMS-style conversations between Shane, each family member, Mikayla,
-- and the household group.
--
-- Threads are implicit: a row belongs to a thread via `thread_key`.
-- Canonical keys: 'family', 'shane', 'molly', 'evey', 'jax', 'mikayla'.
--
-- `sender` is either a family member slug or 'mikayla' when she writes
-- on someone's behalf / proactively (e.g. morning brief in family).

create table if not exists public.chat_messages (
  id          bigserial primary key,
  thread_key  text not null,
  sender      text not null,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_thread_idx
  on public.chat_messages (thread_key, created_at desc);

create index if not exists chat_messages_unread_idx
  on public.chat_messages (thread_key)
  where read_at is null;

comment on table public.chat_messages is
  'SMS-style threaded messages. thread_key = family|<member>|mikayla.';
