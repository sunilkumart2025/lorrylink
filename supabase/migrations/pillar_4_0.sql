-- =============================================
-- Migration: Pillar 4.0 Advanced Trip Execution
-- Run this in Supabase SQL Editor
-- =============================================

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS current_milestone TEXT DEFAULT 'started',
ADD COLUMN IF NOT EXISTS loading_proof_url TEXT,
ADD COLUMN IF NOT EXISTS delivery_proof_url TEXT,
ADD COLUMN IF NOT EXISTS milestone_history JSONB DEFAULT '{}'::jsonb;

-- Comment for Clarity
COMMENT ON COLUMN bookings.current_milestone IS 'Stages: started, arrived_pickup, loaded, in_transit, arrived_destination, delivered';
