-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Create user_locations table for real-time tracking
create table if not exists public.user_locations (
  id uuid primary key default gen_random_uuid(),
  device_id uuid unique not null, -- using user_id as device_id
  latitude double precision not null,
  longitude double precision not null,
  updated_at timestamptz not null default now()
);

-- Index for performance querying by time
create index if not exists user_locations_updated_at_idx on public.user_locations(updated_at);

-- Enable realtime for this table
-- Note: Replace 'supabase_realtime' if your publication name differs
do $$ 
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.user_locations;
  end if;
end $$;
