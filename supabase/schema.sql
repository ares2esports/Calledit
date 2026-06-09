-- World Cup Fantasy Pool — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard > SQL > New query).

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Player',
  created_at timestamptz default now()
);

create table public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  owner_id uuid not null references auth.users,
  is_public boolean not null default false,
  lock_at timestamptz not null default '2026-06-28T19:00:00Z',
  scoring jsonb not null default '{"R32":1,"R16":2,"QF":4,"SF":6,"F":10,"champBonus":5}',
  created_at timestamptz default now()
);

create table public.pool_members (
  pool_id uuid references public.pools on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz default now(),
  primary key (pool_id, user_id)
);

create table public.brackets (
  pool_id uuid references public.pools on delete cascade,
  user_id uuid references auth.users on delete cascade,
  picks jsonb not null default '{}',        -- { "73": "team1" | "team2", ... }
  tiebreaker int,                            -- predicted total goals in the final
  updated_at timestamptz default now(),
  primary key (pool_id, user_id)
);

-- Global knockout results (match numbers 73-104), synced from the public feed
create table public.matches (
  num int primary key,
  round text not null,
  team1 text,
  team2 text,
  score1 int,
  score2 int,
  winner text check (winner in ('team1','team2')),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.pools enable row level security;
alter table public.pool_members enable row level security;
alter table public.brackets enable row level security;
alter table public.matches enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "pools readable" on public.pools for select using (true);
create policy "create pool" on public.pools for insert with check (auth.uid() = owner_id);
create policy "owner updates pool" on public.pools for update using (auth.uid() = owner_id);

create policy "members readable" on public.pool_members for select using (true);
create policy "join pool" on public.pool_members for insert with check (auth.uid() = user_id);
create policy "leave pool" on public.pool_members for delete using (auth.uid() = user_id);

create policy "brackets readable" on public.brackets for select using (true);
create policy "own bracket insert" on public.brackets for insert with check (auth.uid() = user_id);
create policy "own bracket update" on public.brackets for update using (auth.uid() = user_id);

create policy "matches readable" on public.matches for select using (true);
create policy "auth can sync results" on public.matches for insert with check (auth.role() = 'authenticated');
create policy "auth can update results" on public.matches for update using (auth.role() = 'authenticated');

-- Enforce pick lock server-side: reject bracket writes after the pool locks
create or replace function public.enforce_lock() returns trigger as $$
begin
  if (select lock_at from public.pools where id = new.pool_id) <= now() then
    raise exception 'Picks are locked for this pool';
  end if;
  new.updated_at := now();
  return new;
end; $$ language plpgsql security definer;

create trigger brackets_lock before insert or update on public.brackets
  for each row execute function public.enforce_lock();

-- Realtime
alter publication supabase_realtime add table public.brackets;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.pool_members;
