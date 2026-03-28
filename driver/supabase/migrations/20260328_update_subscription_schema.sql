-- Update profiles table for the new subscription system
-- Tier: 'SILVER', 'GOLD', 'PLATINUM', 'FLEET'
-- Billing Cycle: 'monthly', 'yearly'

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_billing_cycle TEXT DEFAULT 'yearly' CHECK (subscription_billing_cycle IN ('monthly', 'yearly'));

-- Note: We assume the existing 'subscription_tier' column handles the name updates 
-- and 'subscription_expires_at' handles the duration.
