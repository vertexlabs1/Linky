-- Linky Admin Portal Schema Reconciliation
-- Migration: 20250721_reconcile_admin_schema.sql
-- Description: Reconcile database schema with TypeScript interfaces
-- Author: Cursor AI for Linky
-- Date: 2025-07-21

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('user', 'admin', 'founding_member')),
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles if they don't exist
INSERT INTO roles (name, description, permissions) VALUES
  ('user', 'Standard user with basic access', '{"read_own_data": true}'),
  ('admin', 'Administrator with full access', '{"read_all": true, "write_all": true, "manage_users": true, "manage_subscriptions": true}'),
  ('founding_member', 'Founding member with premium access', '{"read_own_data": true, "premium_features": true}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- USERS TABLE (Reconciled)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Auth integration
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Basic user info
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  
  -- Account status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
  email_verified BOOLEAN DEFAULT FALSE,
  password_set BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER_ROLES TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  
  -- Ensure unique user-role combinations
  UNIQUE(user_id, role_id)
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE (Reconciled)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_session_id TEXT,
  stripe_subscription_schedule_id TEXT,
  
  -- Subscription details
  plan_name TEXT NOT NULL CHECK (plan_name IN ('free', 'founding_member', 'prospector', 'networker', 'rainmaker')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'founding_member')),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'past_due', 'cancelled', 'unpaid', 'trialing')),
  
  -- Billing details
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  billing_cycle_start TIMESTAMP WITH TIME ZONE,
  billing_cycle_end TIMESTAMP WITH TIME ZONE,
  
  -- Promotional details
  promo_active BOOLEAN DEFAULT FALSE,
  promo_type TEXT,
  promo_expiration_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NEWSLETTER_SUBSCRIPTIONS TABLE (Reconciled)
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  
  -- Subscription details
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'pending')),
  source TEXT DEFAULT 'waitlist' CHECK (source IN ('waitlist', 'newsletter', 'founding_member', 'manual', 'import')),
  
  -- Preferences
  preferences JSONB DEFAULT '{}',
  
  -- Engagement tracking
  confirmed_at TIMESTAMP WITH TIME ZONE,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROMOTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  
  -- Promotion details
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_trial', 'founding_member')),
  value DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  
  -- Usage limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  
  -- Validity
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER_PROMOTIONS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Usage tracking
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stripe_coupon_id TEXT,
  
  -- Ensure unique user-promotion combinations
  UNIQUE(user_id, promotion_id)
);

-- ============================================================================
-- STRIPE_EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Stripe event details
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(active);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_name ON subscriptions(plan_name);

-- Newsletter subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_user_id ON newsletter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_status ON newsletter_subscriptions(status);

-- Promotions indexes
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_expires_at ON promotions(expires_at);

-- User promotions indexes
CREATE INDEX IF NOT EXISTS idx_user_promotions_user_id ON user_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_promotions_promotion_id ON user_promotions(promotion_id);

-- Stripe events indexes
CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_event_id ON stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created_at ON stripe_events(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_newsletter_subscriptions_updated_at BEFORE UPDATE ON newsletter_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_stripe_events_updated_at BEFORE UPDATE ON stripe_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_promotions_updated_at BEFORE UPDATE ON user_promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON roles;

DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Users can view own newsletter subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Service role can manage newsletter subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON newsletter_subscriptions;

DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Service role can manage promotions" ON promotions;

DROP POLICY IF EXISTS "Users can view own promotions" ON user_promotions;
DROP POLICY IF EXISTS "Service role can manage user promotions" ON user_promotions;

DROP POLICY IF EXISTS "Service role can manage stripe events" ON stripe_events;
DROP POLICY IF EXISTS "Admins can view stripe events" ON stripe_events;

-- USERS POLICIES
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = auth_user_id OR auth.email() = email);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id OR auth.email() = email)
    WITH CHECK (auth.uid() = auth_user_id OR auth.email() = email);

CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.active = TRUE
        )
    );

-- ROLES POLICIES
CREATE POLICY "Anyone can view roles" ON roles
    FOR SELECT USING (TRUE);

CREATE POLICY "Service role can manage roles" ON roles
    FOR ALL USING (auth.role() = 'service_role');

-- USER_ROLES POLICIES
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage user roles" ON user_roles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.active = TRUE
        )
    );

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.active = TRUE
        )
    );

-- NEWSLETTER_SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can view own newsletter subscriptions" ON newsletter_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage newsletter subscriptions" ON newsletter_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can subscribe to newsletter" ON newsletter_subscriptions
    FOR INSERT WITH CHECK (TRUE);

-- PROMOTIONS POLICIES
CREATE POLICY "Anyone can view active promotions" ON promotions
    FOR SELECT USING (active = TRUE);

CREATE POLICY "Service role can manage promotions" ON promotions
    FOR ALL USING (auth.role() = 'service_role');

-- USER_PROMOTIONS POLICIES
CREATE POLICY "Users can view own promotions" ON user_promotions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage user promotions" ON user_promotions
    FOR ALL USING (auth.role() = 'service_role');

-- STRIPE_EVENTS POLICIES
CREATE POLICY "Service role can manage stripe events" ON stripe_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view stripe events" ON stripe_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.active = TRUE
        )
    );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions to service role
GRANT ALL ON users TO service_role;
GRANT ALL ON roles TO service_role;
GRANT ALL ON user_roles TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON newsletter_subscriptions TO service_role;
GRANT ALL ON promotions TO service_role;
GRANT ALL ON user_promotions TO service_role;
GRANT ALL ON stripe_events TO service_role;

-- Grant select permissions to authenticated users
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON newsletter_subscriptions TO authenticated;
GRANT SELECT ON promotions TO authenticated;
GRANT SELECT ON user_promotions TO authenticated;

-- Grant insert permissions for newsletter subscriptions
GRANT INSERT ON newsletter_subscriptions TO anon;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name TEXT, role_description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.description
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid AND ur.active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid 
        AND r.name = role_name 
        AND ur.active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant role to user
CREATE OR REPLACE FUNCTION grant_user_role(user_uuid UUID, role_name TEXT, granted_by_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    role_uuid UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_uuid FROM roles WHERE name = role_name;
    
    IF role_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update user role
    INSERT INTO user_roles (user_id, role_id, granted_by)
    VALUES (user_uuid, role_uuid, granted_by_uuid)
    ON CONFLICT (user_id, role_id) 
    DO UPDATE SET 
        active = TRUE,
        granted_by = granted_by_uuid,
        granted_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke role from user
CREATE OR REPLACE FUNCTION revoke_user_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    role_uuid UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_uuid FROM roles WHERE name = role_name;
    
    IF role_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Deactivate user role
    UPDATE user_roles 
    SET active = FALSE 
    WHERE user_id = user_uuid AND role_id = role_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 