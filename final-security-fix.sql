-- FINAL SECURITY FIX - Enable RLS on remaining open tables
-- This completes the database restoration process

-- Enable RLS on the 3 tables that are currently open
ALTER TABLE billing_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create secure policies for billing_changes
CREATE POLICY "Admin and service role access" ON billing_changes
    FOR ALL USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.is_admin = true
        )
    );

-- Create secure policies for payment_methods
CREATE POLICY "Users can manage own payment methods" ON payment_methods
    FOR ALL USING (
        auth.role() = 'service_role'
        OR user_id IN (
            SELECT id FROM users 
            WHERE auth_user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.is_admin = true
        )
    );

-- Create secure policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR ALL USING (
        auth.role() = 'service_role'
        OR user_id IN (
            SELECT id FROM users 
            WHERE auth_user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.is_admin = true
        )
    );

-- Verify all tables are now secured
SELECT 'FINAL SECURITY CHECK:' as check_type;
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'SECURED ✓'
    ELSE 'STILL OPEN ❌'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('billing_changes', 'payment_methods', 'transactions')
ORDER BY tablename;

SELECT 'DATABASE RESTORATION COMPLETE! 🎉' as final_status; 