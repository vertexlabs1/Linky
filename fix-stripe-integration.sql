-- Fix Stripe Integration - Add Missing Database Columns
-- This script adds the missing columns needed for promo tracking and subscription management

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'regular';

-- Add constraint for valid promo types
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_promo_types;
ALTER TABLE users 
ADD CONSTRAINT valid_promo_types 
CHECK (promo_type IN ('founding_member', 'one_week_trial', 'beta_tester', 'early_adopter'));

-- Create a view for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.subscription_plan,
    u.subscription_status,
    u.stripe_customer_id,
    u.stripe_subscription_id,
    u.stripe_subscription_schedule_id,
    u.promo_active,
    u.promo_type,
    u.promo_expiration_date,
    u.subscription_type,
    u.created_at,
    u.updated_at
FROM users u
WHERE u.subscription_status = 'active' 
   OR u.promo_active = true;

-- Create a view for founding members
CREATE OR REPLACE VIEW founding_members AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.subscription_plan,
    u.subscription_status,
    u.stripe_customer_id,
    u.stripe_subscription_id,
    u.stripe_subscription_schedule_id,
    u.promo_active,
    u.promo_type,
    u.promo_expiration_date,
    u.subscription_type,
    u.created_at,
    u.updated_at
FROM users u
WHERE u.promo_type = 'founding_member' 
   OR u.subscription_plan = 'founding_member';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_promo_active ON users(promo_active);
CREATE INDEX IF NOT EXISTS idx_users_promo_type ON users(promo_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Update existing user (Tyler Amos) with proper Stripe data
UPDATE users 
SET 
    stripe_customer_id = 'cus_ShJXt4f5hvfgHx',
    stripe_subscription_id = 'sub_ShJXt4f5hvfgHx',
    stripe_subscription_schedule_id = 'sub_sched_ShJXt4f5hvfgHx',
    promo_active = true,
    promo_type = 'founding_member',
    promo_expiration_date = NOW() + INTERVAL '3 months',
    subscription_type = 'founding_member',
    subscription_plan = 'founding_member',
    subscription_status = 'active',
    updated_at = NOW()
WHERE email = 'tyler@linky.app';

-- Verify the changes
SELECT 
    email,
    subscription_plan,
    subscription_status,
    promo_active,
    promo_type,
    stripe_customer_id,
    stripe_subscription_id
FROM users 
WHERE email = 'tyler@linky.app'; 