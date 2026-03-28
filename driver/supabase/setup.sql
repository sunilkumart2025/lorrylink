-- 1. EXTENSIONS
create extension if not exists postgis schema public;
create extension if not exists "uuid-ossp" schema public;

-- 2. TABLES

-- Profiles (extends Supabase Auth)
create table profiles (
  id uuid references auth.users not null primary key,
  role text not null check (role in ('driver', 'business')),
  email text,
  phone text,
  name text,
  home_city text,
  home_location geography(Point, 4326),
  preferred_language text default 'en',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trucks (Drivers' vehicles)
create table trucks (
  id uuid default uuid_generate_v4() primary key,
  driver_id uuid references profiles(id) not null,
  vehicle_number text,
  vehicle_type text not null,
  capacity_kg integer not null,
  capacity_volume numeric,
  ulip_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Active Routes (Posted by drivers)
create table routes (
  id uuid default uuid_generate_v4() primary key,
  truck_id uuid references trucks(id) not null,
  origin text not null,
  destination text not null,
  origin_location geography(POINT) not null,
  destination_location geography(POINT) not null,
  departure_time timestamp with time zone not null,
  expected_arrival timestamp with time zone not null,
  is_return_trip boolean default false,
  available_capacity_kg integer not null,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Shipments (Posted by businesses)
create table shipments (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references profiles(id) not null,
  pickup_address text not null,
  drop_address text not null,
  pickup_location geography(POINT) not null,
  drop_location geography(POINT) not null,
  weight_kg integer not null,
  price numeric not null,
  status text default 'pending' check (status in ('pending', 'matched', 'in_transit', 'delivered', 'cancelled')),
  is_partial boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Matches (AI suggested links)
create table matches (
  id uuid default uuid_generate_v4() primary key,
  route_id uuid references routes(id) not null,
  shipment_id uuid references shipments(id) not null,
  match_score numeric not null,
  detour_km numeric not null,
  status text default 'suggested' check (status in ('suggested', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings (Confirmed trips)
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid references shipments(id) not null,
  driver_id uuid references profiles(id) not null,
  business_id uuid references profiles(id) not null,
  route_id uuid references routes(id),
  agreed_price numeric not null,
  status text default 'requested' check (status in ('requested', 'in_progress', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tracking (Live updates)
create table tracking (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) not null,
  location geography(POINT) not null,
  speed numeric default 0,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  driver_id uuid references profiles(id) not null,
  business_id uuid references profiles(id) not null,
  booking_id uuid references bookings(id) not null,
  rating numeric not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ROW LEVEL SECURITY (RLS)
alter table profiles enable row level security;
alter table trucks enable row level security;
alter table routes enable row level security;
alter table shipments enable row level security;
alter table matches enable row level security;
alter table bookings enable row level security;
alter table tracking enable row level security;
alter table reviews enable row level security;

-- Profiles: Anyone can read profiles. Users can only update their own.
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile." on profiles for insert with check (auth.uid() = id);

-- Trucks: Drivers can CRUD their own trucks. Shippers can view.
create policy "Trucks are viewable by everyone." on trucks for select using (true);
create policy "Drivers can insert their own trucks." on trucks for insert with check (auth.uid() = driver_id);
create policy "Drivers can update their own trucks." on trucks for update using (auth.uid() = driver_id);

-- Routes: Everyone can see active routes. Drivers manage theirs.
create policy "Routes are viewable by everyone." on routes for select using (true);
create policy "Drivers can insert their own routes." on routes for insert with check (auth.uid() IN (SELECT driver_id FROM trucks WHERE trucks.id = truck_id));
create policy "Drivers can update their own routes." on routes for update using (auth.uid() IN (SELECT driver_id FROM trucks WHERE trucks.id = truck_id));

-- Shipments: Everyone can view. Only businesses can create.
create policy "Shipments viewable by everyone." on shipments for select using (true);
create policy "Businesses manage own shipments." on shipments for insert with check (auth.uid() = business_id);
create policy "Businesses update own shipments." on shipments for update using (auth.uid() = business_id);

-- Bookings: Visible to involved driver and business.
create policy "Involved users can view bookings" on bookings for select using (auth.uid() = driver_id or auth.uid() = business_id);
create policy "Drivers can request bookings" on bookings for insert with check (auth.uid() = driver_id or auth.uid() = business_id);
create policy "Involved users can update bookings" on bookings for update using (auth.uid() = driver_id or auth.uid() = business_id);

-- Tracking: Insert by driver, view by business and driver.
create policy "Drivers can insert tracking" on tracking for insert with check (
  auth.uid() IN (SELECT driver_id FROM bookings WHERE bookings.id = booking_id)
);
create policy "Involved users view tracking" on tracking for select using (
  auth.uid() IN (SELECT driver_id FROM bookings WHERE bookings.id = booking_id) OR
  auth.uid() IN (SELECT business_id FROM bookings WHERE bookings.id = booking_id)
);

-- Reviews: Anyone can read reviews (social proof). Only involved users can insert.
alter table reviews enable row level security;
create policy "Reviews are public" on reviews for select using (true);
create policy "Involved users can submit reviews" on reviews for insert with check (
  auth.uid() IN (
    SELECT driver_id FROM bookings WHERE bookings.id = booking_id
    UNION
    SELECT business_id FROM bookings WHERE bookings.id = booking_id
  )
);

-- Matches: Drivers and businesses can view suggested matches.
alter table matches enable row level security;
create policy "Matches are viewable by everyone" on matches for select using (true);
create policy "System can insert matches" on matches for insert with check (true);

-- 4. RPC Methods

-- Heatmap density via RPC
create or replace function shipment_density()
returns table(city text, count bigint, avg_rate numeric, lng numeric, lat numeric)
language sql security definer as $$
  select 
    split_part(pickup_address, ',', 1) as city,
    count(*),
    avg(price) as avg_rate,
    st_x(pickup_location::geometry) as lng,
    st_y(pickup_location::geometry) as lat
  from shipments
  where status = 'pending'
  group by split_part(pickup_address, ',', 1), st_x(pickup_location::geometry), st_y(pickup_location::geometry);
$$;

-- Enable logical replication for realtime on all tables
alter publication supabase_realtime add table tracking, shipments, routes, bookings, matches, reviews;

-- =========================================
-- 🚀 PILLAR 2 & 3 ADVANCED UPGRADES
-- =========================================

-- Route Cache for Edge Function
create table route_cache (
    id uuid primary key default uuid_generate_v4(),
    url_hash text unique not null,
    route_data jsonb not null,
    created_at timestamp default now()
);

-- Advanced PostGIS distance scoring for Home Routes
create or replace function get_home_scored_shipments(driver_id uuid)
returns table(
    id uuid,
    business_id uuid,
    pickup_address text,
    drop_address text,
    pickup_location geography(Point, 4326),
    drop_location geography(Point, 4326),
    weight_kg integer,
    is_partial boolean,
    price numeric,
    status text,
    created_at timestamptz,
    distance_home_km numeric
)
language plpgsql security definer as $$
declare
    v_home geography(Point, 4326);
begin
    -- Get driver's home location
    select home_location into v_home from profiles where profiles.id = driver_id;

    -- Return shipments joined with distance to home (in km). Sorted by closest to home.
    return query
    select 
        s.id, s.business_id, s.pickup_address, s.drop_address,
        s.pickup_location, s.drop_location, s.weight_kg,
        s.is_partial, s.price, s.status, s.created_at,
        (ST_Distance(s.drop_location, v_home) / 1000)::numeric as distance_home_km
    from shipments s
    where s.status = 'pending'
    order by 
        case when v_home is not null then ST_Distance(s.drop_location, v_home) else 0 end asc,
        s.created_at desc;
end;
$$;

