-- public.tasks
-- Unified per-person task list. Replaces public.chores (kid-coded) and
-- public.todos (Shane-coded). Label is a UI render decision based on
-- assignee role (kid → "Chores"; adult → "To-Dos"); the data is one model.
create table if not exists public.tasks (
  id           bigserial primary key,
  assignee     text        not null,
  title        text        not null,
  due_date     date,
  done_at      timestamptz,
  notes        text,
  created_by   text,
  created_at   timestamptz not null default now()
);

create index if not exists tasks_assignee_open_idx
  on public.tasks (assignee, due_date)
  where done_at is null;

create index if not exists tasks_created_at_idx
  on public.tasks (created_at desc);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_anon" on public.tasks;
create policy "tasks_select_anon"
  on public.tasks for select
  to anon, authenticated
  using (true);

drop policy if exists "tasks_insert_anon" on public.tasks;
create policy "tasks_insert_anon"
  on public.tasks for insert
  to anon, authenticated
  with check (true);

drop policy if exists "tasks_update_anon" on public.tasks;
create policy "tasks_update_anon"
  on public.tasks for update
  to anon, authenticated
  using (true)
  with check (true);

comment on table public.tasks is
  'Unified per-person task list. Replaces public.chores + public.todos. UI labels as Chores/To-Dos based on assignee role.';

-- One-shot data migration. Old tables are kept for now as backup; drop
-- once the /tasks surface has been live for a few days without issues.
insert into public.tasks (assignee, title, due_date, done_at, notes, created_by, created_at)
select assignee, title, due_date, done_at, notes, created_by, created_at
from public.chores;

insert into public.tasks (assignee, title, due_date, done_at, notes, created_by, created_at)
select
  'shane'                                                as assignee,
  text                                                   as title,
  null                                                   as due_date,
  case when done then created_at else null end           as done_at,
  case when cat in ('business','family')
       then 'cat:' || cat
       else null
  end                                                    as notes,
  'shane'                                                as created_by,
  created_at
from public.todos;
