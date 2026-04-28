-- Anon-role read/write policies for notifications + processed_emails.
-- Matches the pattern already in use on public.tasks / public.memories:
-- the family app uses the anon key for everything (single-household,
-- not multi-tenant), and locks down via app-level scoping.

-- notifications
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_select_anon') then
    create policy notifications_select_anon on public.notifications
      for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_insert_anon') then
    create policy notifications_insert_anon on public.notifications
      for insert to anon with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_update_anon') then
    create policy notifications_update_anon on public.notifications
      for update to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_delete_anon') then
    create policy notifications_delete_anon on public.notifications
      for delete to anon using (true);
  end if;
end $$;

-- processed_emails
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='processed_emails' and policyname='processed_emails_select_anon') then
    create policy processed_emails_select_anon on public.processed_emails
      for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='processed_emails' and policyname='processed_emails_insert_anon') then
    create policy processed_emails_insert_anon on public.processed_emails
      for insert to anon with check (true);
  end if;
end $$;
