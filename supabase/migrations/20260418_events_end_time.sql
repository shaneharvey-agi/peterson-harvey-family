-- Add nullable end_time to events.
-- Ranges are the canonical shape; callers derive duration when needed.
-- Existing rows get NULL (display falls back to start time only).

alter table public.events
  add column if not exists end_time time;

comment on column public.events.end_time is
  'Optional end time for the event. NULL = unbounded / display start only.';
