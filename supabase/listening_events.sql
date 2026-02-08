create table if not exists public.listening_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id text not null,
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists listening_events_user_played_at_idx
  on public.listening_events (user_id, played_at desc);

create index if not exists listening_events_user_id_id_idx
  on public.listening_events (user_id, id desc);

alter table public.listening_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'listening_events'
      and policyname = 'Users can insert own listening events'
  ) then
    create policy "Users can insert own listening events"
      on public.listening_events
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Automatic retention:
-- 1) Delete events older than 90 days for the current user.
-- 2) Keep only the latest 5000 events per user.
create or replace function public.prune_listening_events_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.listening_events
  where user_id = new.user_id
    and played_at < now() - interval '90 days';

  delete from public.listening_events
  where user_id = new.user_id
    and id in (
      select id
      from public.listening_events
      where user_id = new.user_id
      order by id desc
      offset 5000
    );

  return new;
end;
$$;

drop trigger if exists trg_prune_listening_events_for_user on public.listening_events;
create trigger trg_prune_listening_events_for_user
after insert on public.listening_events
for each row
execute function public.prune_listening_events_for_user();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'listening_events'
      and policyname = 'Users can read own listening events'
  ) then
    create policy "Users can read own listening events"
      on public.listening_events
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
