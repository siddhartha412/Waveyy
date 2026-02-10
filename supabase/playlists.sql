create table if not exists public.playlists (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists playlists_user_created_idx
  on public.playlists (user_id, created_at desc);

create table if not exists public.playlist_songs (
  playlist_id text not null references public.playlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id text not null,
  song_name text not null,
  song_artist text not null,
  song_image text not null,
  play_count bigint not null default 0,
  created_at timestamptz not null default now(),
  primary key (playlist_id, song_id)
);

create index if not exists playlist_songs_user_playlist_idx
  on public.playlist_songs (user_id, playlist_id, created_at desc);

alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'playlists'
      and policyname = 'Users can manage own playlists'
  ) then
    create policy "Users can manage own playlists"
      on public.playlists
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'playlist_songs'
      and policyname = 'Users can manage own playlist songs'
  ) then
    create policy "Users can manage own playlist songs"
      on public.playlist_songs
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

