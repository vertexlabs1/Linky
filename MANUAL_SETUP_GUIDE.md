# 🔧 Manual Setup Guide - Stripe Integration Fix

## 📋 **Current Status**

✅ **Completed:**
- Basic user data updated (Tyler's Stripe Customer ID and Subscription ID linked)
- Webhook handlers updated for future users
- Migration files created
- All scripts prepared

⏳ **Pending:**
- Database columns need to be added manually
- Current user needs promo tracking data
- Webhook testing

## 🔧 **Step 1: Add Database Columns**

**Go to your Supabase Dashboard:**
1. Navigate to: https://supabase.com/dashboard/project/jydldvvsxwosyzwttmui
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy and paste this SQL:

```sql
-- Add promo tracking columns to users table
-- This migration adds the missing columns for proper Stripe integration

-- Add promo tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_expiration_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT;

-- Add constraints for valid promo types
ALTER TABLE users 
ADD CONSTRAINT valid_promo_types 
CHECK (promo_type IN ('founding_member', 'one_week_trial', 'beta_tester', 'early_adopter'));

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_promo_active ON users(promo_active) WHERE promo_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_promo_expiration ON users(promo_expiration_date) WHERE promo_active = TRUE;

-- Create views for easy management
CREATE OR REPLACE VIEW active_promos AS
SELECT 
  id, email, first_name, last_name, promo_type, promo_expiration_date,
  subscription_plan, subscription_status, created_at
FROM users 
WHERE promo_active = TRUE AND promo_expiration_date > NOW();

CREATE OR REPLACE VIEW expired_promos AS
SELECT 
  id, email, first_name, last_name, promo_type, promo_expiration_date,
  subscription_plan, subscription_status, created_at
FROM users 
WHERE promo_active = TRUE AND promo_expiration_date <= NOW();
```

5. Click **"Run"** to execute the SQL
6. You should see success messages for each statement

## 🔧 **Step 2: Update Current User**

**After adding the columns, run this command:**

```bash
node manual-user-update.js
```

This will update Tyler's account with:
- Promo tracking data
- Subscription schedule ID
- Proper promo expiration date

## 🔧 **Step 3: Test the Webhook**

**Test the subscription schedule release:**
1. Go to your Stripe Dashboard
2. Navigate to **Subscriptions** → **Subscription Schedules**
3. Find the schedule: `sub_sched_1RmLeEK06flw6v4hjaTSiqyw`
4. Manually trigger the release (if possible)
5. Check your webhook logs for `subscription_schedule.released` events

## 📊 **Expected Results**

### **After Step 1 (Database Columns):**
- New columns added to `users` table
- Indexes created for efficient queries
- Views created for easy management

### **After Step 2 (User Update):**
- Tyler's account will have complete promo tracking
- Subscription schedule properly linked
- Promo expiration set to 3 months from signup

### **After Step 3 (Webhook Test):**
- Webhook should properly handle schedule releases
- User records should update when promos expire
- Transition from $25/3months to $75/month should work

## 🎯 **Verification Steps**

### **Check Database Columns:**
```sql
-- Run this in SQL Editor to verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('promo_active', 'promo_type', 'promo_expiration_date', 'stripe_subscription_schedule_id', 'subscription_type');
```

### **Check Current User:**
```sql
-- Run this to verify Tyler's data
SELECT 
  email, first_name, last_name,
  promo_active, promo_type, promo_expiration_date,
  stripe_customer_id, stripe_subscription_id, stripe_subscription_schedule_id,
  subscription_plan, subscription_status, founding_member
FROM users 
WHERE email = 'tyleramos2025@gmail.com';
```

### **Check Views:**
```sql
-- Run this to verify views were created
SELECT * FROM active_promos;
SELECT * FROM expired_promos;
```

## 🚨 **Troubleshooting**

### **If SQL execution fails:**
- Make sure you're in the correct project
- Check that you have admin permissions
- Try running statements one by one

### **If user update fails:**
- Verify the columns were added successfully
- Check that the service role key is correct
- Ensure the user exists in the database

### **If webhook doesn't work:**
- Check Stripe webhook configuration
- Verify the webhook endpoint is correct
- Monitor webhook logs in Supabase

## 📞 **Support**

If you encounter any issues:
1. **Database issues**: Check Supabase logs
2. **User update issues**: Verify service role key
3. **Webhook issues**: Check Stripe webhook configuration

---

**Status**: 🟡 **Ready for Manual Setup** - Follow the steps above to complete the implementation 