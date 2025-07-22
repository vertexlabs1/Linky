-- Complete Database Setup for Linky
-- This script runs all necessary migrations to complete the background agent's fixes

-- =====================================================
-- 1. CREATE TRANSACTIONS TABLE (Payment History)
-- =====================================================

-- Create transactions table for payment history
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN (
    'succeeded',
    'pending',
    'failed',
    'canceled',
    'refunded',
    'partially_refunded'
  )),
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_charge_id ON transactions(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_invoice_id ON transactions(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Create unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_payment_intent_unique ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_charge_unique ON transactions(stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_invoice_unique ON transactions(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Payment history for all customer transactions from Stripe';
COMMENT ON COLUMN transactions.amount IS 'Amount in cents (e.g., 2500 = $25.00)';
COMMENT ON COLUMN transactions.status IS 'Payment status from Stripe';

-- =====================================================
-- 2. CREATE BILLING CHANGES TABLE (Audit Trail)
-- =====================================================

-- Create billing_changes table for audit trail
CREATE TABLE IF NOT EXISTS billing_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id),
  change_type TEXT NOT NULL CHECK (change_type IN (
    'billing_update', 
    'payment_method_add', 
    'payment_method_remove',
    'subscription_change',
    'refund_processed',
    'account_update'
  )),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for billing changes
CREATE INDEX IF NOT EXISTS idx_billing_changes_user_id ON billing_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_changes_admin_id ON billing_changes(admin_id);
CREATE INDEX IF NOT EXISTS idx_billing_changes_created_at ON billing_changes(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_changes_change_type ON billing_changes(change_type);

-- =====================================================
-- 3. CREATE PAYMENT METHODS TABLE
-- =====================================================

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

-- =====================================================
-- 4. ADD MISSING COLUMNS TO USERS TABLE
-- =====================================================

-- Add promo tracking columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'regular';

-- Add billing information columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_address JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Add subscription tracking columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Create function to log billing changes
CREATE OR REPLACE FUNCTION log_billing_change(
  p_user_id UUID,
  p_admin_id UUID,
  p_change_type TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  change_id UUID;
BEGIN
  INSERT INTO billing_changes (
    user_id,
    admin_id,
    change_type,
    old_values,
    new_values,
    reason,
    stripe_customer_id,
    stripe_subscription_id
  ) VALUES (
    p_user_id,
    p_admin_id,
    p_change_type,
    p_old_values,
    p_new_values,
    p_reason,
    (SELECT stripe_customer_id FROM users WHERE id = p_user_id),
    (SELECT stripe_subscription_id FROM users WHERE id = p_user_id)
  ) RETURNING id INTO change_id;
  
  RETURN change_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for user payment history
CREATE OR REPLACE VIEW user_payment_history AS
SELECT 
  t.*,
  u.email,
  u.first_name,
  u.last_name
FROM transactions t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- Create view for user payment methods
CREATE OR REPLACE VIEW user_payment_methods AS
SELECT 
  pm.*,
  u.email,
  u.first_name,
  u.last_name
FROM payment_methods pm
JOIN users u ON pm.user_id = u.id
ORDER BY pm.is_default DESC, pm.created_at DESC;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 'transactions' as table_name, COUNT(*) as row_count FROM transactions
UNION ALL
SELECT 'billing_changes' as table_name, COUNT(*) as row_count FROM billing_changes
UNION ALL
SELECT 'payment_methods' as table_name, COUNT(*) as row_count FROM payment_methods;

-- Check if columns were added to users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('promo_active', 'billing_name', 'last_sync_at')
ORDER BY column_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- This will show in the results if everything worked
SELECT '✅ Database setup completed successfully!' as status; 