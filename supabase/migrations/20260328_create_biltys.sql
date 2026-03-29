-- Create biltys table for digitized waybills
create table if not exists public.biltys (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.profiles(id) not null,
  booking_id uuid references public.bookings(id), -- Optional link to a specific trip
  consignee_name text,
  weight_kg numeric,
  total_price numeric,
  document_url text, -- link to the uploaded photo
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.biltys enable row level security;

-- Policies
create policy "Drivers can manage their own biltys"
  on public.biltys for all
  using (auth.uid() = driver_id);
