-- COMPREHENSIVE FIX FOR MISSING COLUMNS AND TABLES
-- This script adds all missing columns and tables that should exist

-- 1. Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_expired BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_transition_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_member_transitioned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;

-- 2. Create subscription_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed'
  old_plan TEXT,
  new_plan TEXT,
  stripe_subscription_id TEXT,
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create email_subscribers table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  source TEXT DEFAULT 'website', -- 'website', 'waitlist', 'admin'
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create features table if it doesn't exist
CREATE TABLE IF NOT EXISTS features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  plan_required TEXT, -- 'free', 'founding_member', 'pro', 'enterprise'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- 8. Create promotions table if it doesn't exist
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create user_promotions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_coupon_id TEXT,
  UNIQUE(user_id, promotion_id)
);

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_founding_member_expires ON users(founding_member_expires_at) 
WHERE founding_member = TRUE AND founding_member_expired = FALSE;

CREATE INDEX IF NOT EXISTS idx_users_promo_active ON users(promo_active) WHERE promo_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_promo_expiration ON users(promo_expiration_date) WHERE promo_expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_founding_member_transition ON users(founding_member_transition_date) WHERE founding_member = TRUE;

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON email_subscribers(status);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_promotions_valid_until ON promotions(valid_until) WHERE valid_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_promotions_user_id ON user_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_promotions_promotion_id ON user_promotions(promotion_id);

-- 11. Enable RLS on new tables
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_promotions ENABLE ROW LEVEL SECURITY;

-- 12. Create functions
CREATE OR REPLACE FUNCTION check_founding_member_expired()
RETURNS TRIGGER AS $$
BEGIN
  -- If founding_member_expires_at is in the past, mark as expired
  IF NEW.founding_member_expires_at IS NOT NULL 
     AND NEW.founding_member_expires_at < NOW() 
     AND NEW.founding_member_expired = FALSE THEN
    NEW.founding_member_expired = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers
DROP TRIGGER IF EXISTS trigger_check_founding_member_expired ON users;
CREATE TRIGGER trigger_check_founding_member_expired
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_founding_member_expired();

-- 14. Insert default roles
INSERT INTO roles (name, description) VALUES 
  ('admin', 'Full administrative access'),
  ('user', 'Standard user access')
ON CONFLICT (name) DO NOTHING;

-- 15. Insert default features
INSERT INTO features (name, description, plan_required) VALUES 
  ('basic_access', 'Basic platform access', 'free'),
  ('founding_member_features', 'Founding member exclusive features', 'founding_member'),
  ('pro_features', 'Professional features', 'pro'),
  ('enterprise_features', 'Enterprise features', 'enterprise')
ON CONFLICT (name) DO NOTHING;

-- 16. Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content) VALUES 
  ('welcome', 'Welcome to Linky!', '<h1>Welcome to Linky!</h1><p>Thank you for joining us.</p>', 'Welcome to Linky! Thank you for joining us.'),
  ('founding_member_welcome', 'Welcome Founding Member!', '<h1>Welcome Founding Member!</h1><p>You have exclusive access to founding member features.</p>', 'Welcome Founding Member! You have exclusive access to founding member features.')
ON CONFLICT (name) DO NOTHING;

-- 17. Verify the structure
SELECT 'USERS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT 'TABLES CREATED:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 