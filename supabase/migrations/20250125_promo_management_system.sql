-- Promo Management System Migration
-- This migration adds comprehensive promo tracking and management capabilities

-- Add promo expiration date column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;

-- Create promo applications table for detailed tracking
CREATE TABLE IF NOT EXISTS promo_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  promo_type TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  applied_by UUID REFERENCES users(id), -- Admin who applied it
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  metadata JSONB, -- Store additional data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo usage history table
CREATE TABLE IF NOT EXISTS promo_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  promo_application_id UUID REFERENCES promo_applications(id),
  action TEXT NOT NULL CHECK (action IN ('applied', 'expired', 'cancelled', 'extended')),
  amount_saved DECIMAL(10,2),
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_applications_user_id ON promo_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_applications_status ON promo_applications(status);
CREATE INDEX IF NOT EXISTS idx_promo_applications_expires_at ON promo_applications(expires_at);
CREATE INDEX IF NOT EXISTS idx_promo_usage_history_user_id ON promo_usage_history(user_id);

-- Create views for easy management
CREATE OR REPLACE VIEW active_promos_admin AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.promo_type,
  u.promo_expiration_date,
  u.subscription_plan,
  u.subscription_status,
  EXTRACT(EPOCH FROM (u.promo_expiration_date - NOW())) / 86400 AS days_remaining,
  u.created_at
FROM users u
WHERE u.promo_active = TRUE AND u.promo_expiration_date > NOW()
ORDER BY u.promo_expiration_date;

CREATE OR REPLACE VIEW expired_promos_admin AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.promo_type,
  u.promo_expiration_date,
  u.subscription_plan,
  u.subscription_status,
  EXTRACT(EPOCH FROM (NOW() - u.promo_expiration_date)) / 86400 AS days_expired,
  u.created_at
FROM users u
WHERE u.promo_active = TRUE AND u.promo_expiration_date <= NOW()
ORDER BY u.promo_expiration_date DESC;

-- Create function to apply promo to user
CREATE OR REPLACE FUNCTION apply_promo_to_user(
  p_user_id UUID,
  p_promo_type TEXT,
  p_duration_days INTEGER,
  p_applied_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_expiration_date TIMESTAMPTZ;
  v_promo_application_id UUID;
BEGIN
  -- Calculate expiration date
  v_expiration_date := NOW() + (p_duration_days || ' days')::INTERVAL;
  
  -- Create promo application record
  INSERT INTO promo_applications (
    user_id, 
    promo_type, 
    expires_at, 
    applied_by, 
    notes
  ) VALUES (
    p_user_id, 
    p_promo_type, 
    v_expiration_date, 
    p_applied_by, 
    p_notes
  ) RETURNING id INTO v_promo_application_id;
  
  -- Update user record
  UPDATE users 
  SET 
    promo_active = TRUE,
    promo_type = p_promo_type,
    promo_expiration_date = v_expiration_date,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the application
  INSERT INTO promo_usage_history (
    user_id,
    promo_application_id,
    action,
    performed_by,
    notes
  ) VALUES (
    p_user_id,
    v_promo_application_id,
    'applied',
    p_applied_by,
    p_notes
  );
  
  RETURN v_promo_application_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to remove promo from user
CREATE OR REPLACE FUNCTION remove_promo_from_user(
  p_user_id UUID,
  p_removed_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_promo_application_id UUID;
BEGIN
  -- Get the active promo application
  SELECT id INTO v_promo_application_id
  FROM promo_applications
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Update promo application status
  IF v_promo_application_id IS NOT NULL THEN
    UPDATE promo_applications 
    SET status = 'cancelled'
    WHERE id = v_promo_application_id;
  END IF;
  
  -- Update user record
  UPDATE users 
  SET 
    promo_active = FALSE,
    promo_type = NULL,
    promo_expiration_date = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the removal
  INSERT INTO promo_usage_history (
    user_id,
    promo_application_id,
    action,
    performed_by,
    notes
  ) VALUES (
    p_user_id,
    v_promo_application_id,
    'cancelled',
    p_removed_by,
    p_notes
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to extend promo
CREATE OR REPLACE FUNCTION extend_promo_for_user(
  p_user_id UUID,
  p_extension_days INTEGER,
  p_extended_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_promo_application_id UUID;
  v_new_expiration_date TIMESTAMPTZ;
BEGIN
  -- Get the active promo application
  SELECT id INTO v_promo_application_id
  FROM promo_applications
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate new expiration date
  v_new_expiration_date := NOW() + (p_extension_days || ' days')::INTERVAL;
  
  -- Update promo application
  IF v_promo_application_id IS NOT NULL THEN
    UPDATE promo_applications 
    SET 
      expires_at = v_new_expiration_date,
      notes = COALESCE(notes || ' | ', '') || 'Extended by ' || p_extension_days || ' days'
    WHERE id = v_promo_application_id;
  END IF;
  
  -- Update user record
  UPDATE users 
  SET 
    promo_expiration_date = v_new_expiration_date,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the extension
  INSERT INTO promo_usage_history (
    user_id,
    promo_application_id,
    action,
    performed_by,
    notes
  ) VALUES (
    p_user_id,
    v_promo_application_id,
    'extended',
    p_extended_by,
    p_notes
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to expire promos automatically
CREATE OR REPLACE FUNCTION expire_expired_promos()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_promo_application_id UUID;
BEGIN
  -- Find all expired promos
  FOR v_promo_application_id IN
    SELECT pa.id
    FROM promo_applications pa
    JOIN users u ON pa.user_id = u.id
    WHERE pa.status = 'active' 
    AND pa.expires_at <= NOW()
    AND u.promo_active = TRUE
  LOOP
    -- Mark promo application as expired
    UPDATE promo_applications 
    SET status = 'expired'
    WHERE id = v_promo_application_id;
    
    -- Update user record
    UPDATE users 
    SET 
      promo_active = FALSE,
      promo_type = NULL,
      promo_expiration_date = NULL,
      updated_at = NOW()
    WHERE id = (
      SELECT user_id 
      FROM promo_applications 
      WHERE id = v_promo_application_id
    );
    
    -- Log the expiration
    INSERT INTO promo_usage_history (
      user_id,
      promo_application_id,
      action,
      notes
    ) VALUES (
      (SELECT user_id FROM promo_applications WHERE id = v_promo_application_id),
      v_promo_application_id,
      'expired',
      'Automatically expired'
    );
    
    v_expired_count := v_expired_count + 1;
  END LOOP;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for promo tables
ALTER TABLE promo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_usage_history ENABLE ROW LEVEL SECURITY;

-- Admin can read all promo data
CREATE POLICY "Admin can read promo applications" ON promo_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can read promo usage history" ON promo_usage_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Admin can insert promo applications
CREATE POLICY "Admin can insert promo applications" ON promo_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Admin can update promo applications
CREATE POLICY "Admin can update promo applications" ON promo_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Admin can insert promo usage history
CREATE POLICY "Admin can insert promo usage history" ON promo_usage_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Add comments for documentation
COMMENT ON TABLE promo_applications IS 'Tracks all promo code applications to users';
COMMENT ON TABLE promo_usage_history IS 'Audit trail for all promo-related actions';
COMMENT ON FUNCTION apply_promo_to_user IS 'Applies a promo code to a user with full audit trail';
COMMENT ON FUNCTION remove_promo_from_user IS 'Removes an active promo from a user';
COMMENT ON FUNCTION extend_promo_for_user IS 'Extends the duration of an active promo';
COMMENT ON FUNCTION expire_expired_promos IS 'Automatically expires promos that have passed their expiration date'; 