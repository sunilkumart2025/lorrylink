-- Create highway_alerts table for real-time crowdsourced road events
create table if not exists public.highway_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('accident', 'traffic', 'police', 'construction', 'hazard')),
  location geography(POINT) not null,
  description text,
  reported_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

-- Index for geospatial lookups
create index if not exists highway_alerts_location_idx on public.highway_alerts using gist(location);
create index if not exists highway_alerts_expires_at_idx on public.highway_alerts(expires_at);

-- Enable Realtime
do $$ 
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.highway_alerts;
  end if;
end $$;

-- Policy for reporting
alter table public.highway_alerts enable row level security;
create policy "Anyone can view active alerts" on public.highway_alerts for select using (expires_at > now());
create policy "Drivers can report alerts" on public.highway_alerts for insert with check (auth.uid() = reported_by);
