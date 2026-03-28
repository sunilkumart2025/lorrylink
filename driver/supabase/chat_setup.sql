-- PILLAR 4.1: Direct Negotiation Chat (Real-time P2P)

-- 1. Create Messages table for P2P communication
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  shipment_id uuid references shipments(id), -- Context: chat for a specific shipment
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  content text not null,
  type text default 'text' check (type in ('text', 'offer', 'system')),
  metadata jsonb default '{}'::jsonb, -- Store proposed price, weight, etc.
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Row Level Security (RLS)
alter table messages enable row level security;

-- Sender and receiver can view their own messages
create policy "Users can view their own messages" on messages for select 
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Only sender can insert (as themselves)
create policy "Users can insert their own messages" on messages for insert 
with check (auth.uid() = sender_id);

-- Involved users can update (e.g., mark as read)
create policy "Users can update involved messages" on messages for update 
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- 3. Enable Realtime for Messages
alter publication supabase_realtime add table messages;

-- 4. Notification View (Optional: count unread messages)
create or replace view unread_counts as
  select 
    receiver_id,
    count(*) as unread_total
  from messages
  where is_read = false
  group by receiver_id;
