-- =========================================
-- 🚀 EXTENSIONS
-- =========================================
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- =========================================
-- 👤 PROFILES (AUTH USERS)
-- =========================================
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text check (role in ('driver', 'business', 'admin')),
    name text,
    phone text unique,
    email text,
    created_at timestamp default now()
);

-- =========================================
-- 🚛 TRUCKS (ULIP READY)
-- =========================================
create table trucks (
    id uuid primary key default uuid_generate_v4(),
    driver_id uuid references profiles(id) on delete cascade,

    vehicle_number text unique,
    vehicle_type text,
    capacity_kg integer,
    capacity_volume numeric,

    ulip_verified boolean default false,
    documents jsonb,

    created_at timestamp default now()
);

-- =========================================
-- 🗺️ ROUTES (CORE SYSTEM)
-- =========================================
create table routes (
    id uuid primary key default uuid_generate_v4(),
    truck_id uuid references trucks(id) on delete cascade,

    origin text,
    destination text,

    origin_location geography(Point, 4326),
    destination_location geography(Point, 4326),

    departure_time timestamp,
    expected_arrival timestamp,

    is_return_trip boolean default false,

    available_capacity_kg integer,
    available_volume numeric,

    status text check (status in ('active','completed','cancelled')) default 'active',

    created_at timestamp default now()
);

-- =========================================
-- 📦 SHIPMENTS (FULL + PART LOAD)
-- =========================================
create table shipments (
    id uuid primary key default uuid_generate_v4(),
    business_id uuid references profiles(id),

    pickup_location geography(Point, 4326),
    drop_location geography(Point, 4326),

    pickup_address text,
    drop_address text,

    weight_kg integer,
    volume numeric,

    is_partial boolean default true,

    price numeric,

    status text check (status in ('pending','matched','in_transit','delivered','cancelled')) default 'pending',

    created_at timestamp default now()
);

-- =========================================
-- 🤖 AI MATCHES (MAGIC ENGINE)
-- =========================================
create table matches (
    id uuid primary key default uuid_generate_v4(),

    shipment_id uuid references shipments(id) on delete cascade,
    route_id uuid references routes(id) on delete cascade,

    match_score numeric,
    detour_distance_km numeric,
    estimated_profit numeric,

    status text check (status in ('suggested','accepted','rejected')) default 'suggested',

    created_at timestamp default now()
);

-- =========================================
-- 📑 BOOKINGS (UBER FLOW)
-- =========================================
create table bookings (
    id uuid primary key default uuid_generate_v4(),

    shipment_id uuid references shipments(id),
    route_id uuid references routes(id),

    driver_id uuid references profiles(id),
    business_id uuid references profiles(id),

    agreed_price numeric,

    status text check (status in ('requested','confirmed','in_transit','completed','cancelled')) default 'requested',

    created_at timestamp default now()
);

-- =========================================
-- 💳 PAYMENTS
-- =========================================
create table payments (
    id uuid primary key default uuid_generate_v4(),

    booking_id uuid references bookings(id),

    amount numeric,
    payment_status text check (payment_status in ('pending','paid','failed')),

    payment_method text,
    transaction_id text,

    created_at timestamp default now()
);

-- =========================================
-- 📍 REAL-TIME TRACKING
-- =========================================
create table tracking (
    id uuid primary key default uuid_generate_v4(),

    booking_id uuid references bookings(id),

    location geography(Point, 4326),
    speed numeric,

    recorded_at timestamp default now()
);

-- =========================================
-- 🌱 SUSTAINABILITY
-- =========================================
create table sustainability (
    id uuid primary key default uuid_generate_v4(),

    route_id uuid references routes(id),

    distance_saved_km numeric,
    fuel_saved_liters numeric,
    co2_reduction_kg numeric,

    created_at timestamp default now()
);

-- =========================================
-- ⭐ REVIEWS
-- =========================================
create table reviews (
    id uuid primary key default uuid_generate_v4(),

    booking_id uuid references bookings(id),

    rating integer check (rating between 1 and 5),
    comment text,

    created_at timestamp default now()
);

-- =========================================
-- 🔐 RLS ENABLE
-- =========================================
alter table profiles enable row level security;
alter table trucks enable row level security;
alter table routes enable row level security;
alter table shipments enable row level security;
alter table matches enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table tracking enable row level security;

-- =========================================
-- 🔐 RLS POLICIES
-- =========================================

-- profiles
create policy "Users can view own profile"
on profiles for select
using (auth.uid() = id);

-- trucks
create policy "Drivers manage their trucks"
on trucks for all
using (auth.uid() = driver_id);

-- routes
create policy "Drivers manage their routes"
on routes for all
using (
    exists (
        select 1 from trucks 
        where trucks.id = routes.truck_id 
        and trucks.driver_id = auth.uid()
    )
);

-- shipments
create policy "Businesses manage shipments"
on shipments for all
using (auth.uid() = business_id);

-- bookings
create policy "Users see related bookings"
on bookings for select
using (
    auth.uid() = driver_id OR auth.uid() = business_id
);

-- =========================================
-- ⚡ INDEXES (PERFORMANCE)
-- =========================================

create index idx_routes_origin on routes using gist(origin_location);
create index idx_routes_destination on routes using gist(destination_location);

create index idx_shipments_pickup on shipments using gist(pickup_location);
create index idx_shipments_drop on shipments using gist(drop_location);

create index idx_matches_score on matches(match_score desc);

-- =========================================
-- 🤖 MATCH FUNCTION (BASIC AI LOGIC)
-- =========================================

create or replace function find_matches()
returns void as $$
begin
    insert into matches (shipment_id, route_id, match_score)
    select 
        s.id,
        r.id,
        1 / (1 + ST_Distance(s.pickup_location, r.origin_location))
    from shipments s, routes r
    where r.status = 'active'
    and s.status = 'pending';
end;
$$ language plpgsql;
