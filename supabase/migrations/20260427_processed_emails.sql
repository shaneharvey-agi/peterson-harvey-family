-- Tracks which inbound emails the Email Intelligence Bridge has already
-- summarized into a notification, so re-polling doesn't re-create
-- alerts the user already dismissed. Survives notification row deletes.

create table if not exists public.processed_emails (
  id           text primary key,
  from_addr    text,
  subject      text,
  processed_at timestamptz not null default now(),
  notification_id bigint
);

create index if not exists processed_emails_processed_at_idx
  on public.processed_emails (processed_at desc);

comment on table public.processed_emails is
  'Email Intelligence Bridge dedupe ledger. id = provider message id.';
