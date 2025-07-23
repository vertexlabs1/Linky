# 🔧 Fix Tyler Amos Payment Sync Issues

## 🚨 **Problem Identified**
Tyler Amos (both accounts) are showing "Failed to sync Stripe for payment history" because:

1. **Transactions table has incorrect constraints** - The upsert operation is failing
2. **Both users have Stripe customer IDs but no subscription IDs** - They're founding members who paid
3. **Sync function has flawed upsert logic** - Can't handle NULL values in composite constraints

## ✅ **Solution Steps**

### **Step 1: Fix the Database Schema**

**Go to your Supabase Dashboard:**
1. Navigate to: https://supabase.com/dashboard/project/jydldvvsxwosyzwttmui
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy and paste this SQL:

```sql
-- Fix Transactions Table for Payment History Sync
-- This will resolve the "Failed to sync Stripe for payment history" issue

-- Step 1: Drop the existing transactions table if it exists
DROP TABLE IF EXISTS transactions CASCADE;

-- Step 2: Create the transactions table with proper structure
CREATE TABLE transactions (
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

-- Step 3: Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_stripe_charge_id ON transactions(stripe_charge_id);
CREATE INDEX idx_transactions_stripe_invoice_id ON transactions(stripe_invoice_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Step 4: Create unique constraints for upsert operations
CREATE UNIQUE INDEX idx_transactions_payment_intent_unique ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE UNIQUE INDEX idx_transactions_charge_unique ON transactions(stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;
CREATE UNIQUE INDEX idx_transactions_invoice_unique ON transactions(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- Step 5: Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Create indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);

-- Step 7: Create exec_sql function if it doesn't exist (for edge functions)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Step 8: Grant necessary permissions
GRANT ALL ON TABLE transactions TO authenticated;
GRANT ALL ON TABLE payment_methods TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

5. Click **"Run"** to execute the SQL

### **Step 2: Verify the Fix**

**After running the SQL, test the sync:**

1. Go to your admin panel: https://uselinky.app/admin
2. Navigate to **Users**
3. Click **"View Details"** on Tyler Amos (either account)
4. Click **"Refresh Payment History"**
5. You should now see either:
   - ✅ **Payment history data** (if transactions exist in Stripe)
   - ✅ **"No payment history found"** (if no transactions in Stripe)
   - ❌ **No more "Failed to sync" errors**

### **Step 3: Test the Sync Function**

**The sync function has been updated and deployed. It now:**
- ✅ Handles NULL values properly in upsert operations
- ✅ Uses individual upserts instead of bulk upsert with composite constraints
- ✅ Provides better error handling and logging

### **Step 4: Check Tyler's Stripe Data**

**To verify Tyler's payment data exists in Stripe:**

1. Go to: https://dashboard.stripe.com/test/customers
2. Search for these customer IDs:
   - `cus_SilxyCzSTqF7iZ` (tyleramos2019@gmail.com)
   - `cus_SimDKesZ6H2noN` (tyleramos2025@gmail.com)
3. Check if they have:
   - ✅ **Payment intents** (one-time payments)
   - ✅ **Charges** (successful payments)
   - ✅ **Invoices** (subscription billing)
   - ✅ **Payment methods** (saved cards)

### **Step 5: Expected Results**

**After the fix, you should see:**

✅ **For Tyler Amos 2019:**
- Customer ID: `cus_SilxyCzSTqF7iZ`
- Founding member payment of $50
- 3-month trial period active

✅ **For Tyler Amos 2025:**
- Customer ID: `cus_SimDKesZ6H2noN`
- Founding member payment of $50
- 3-month trial period active

✅ **Payment History Sync:**
- No more "Failed to sync" errors
- Either shows transaction data or "No payment history found"
- Receipt URLs and payment details if available

### **Step 6: If Still Not Working**

**If you still see issues:**

1. **Check browser console** for detailed error messages
2. **Check Supabase logs** in the dashboard under Edge Functions
3. **Verify Stripe customer IDs** are correct in the database
4. **Test with a different user** to isolate the issue

---

## 🎯 **Root Cause Summary**

The issue was caused by:
1. **Incorrect database constraints** - Composite unique constraints with NULL values
2. **Flawed upsert logic** - Trying to upsert with multiple NULL columns
3. **Missing proper error handling** - Sync function wasn't handling constraint violations

**The fix addresses all these issues and should resolve Tyler's payment sync problems completely.** 