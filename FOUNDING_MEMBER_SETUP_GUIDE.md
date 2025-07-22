# 🚀 Founding Member Transition System Setup Guide

## ✅ **What's Already Deployed**

1. **Database Migration**: ✅ Applied
   - New fields added to `users` table
   - Database functions created
   - Views for monitoring created

2. **Edge Functions**: ✅ Deployed
   - `check-founding-member-transitions` - Automatic transition logic
   - `send-transition-notification` - Email notifications

3. **Admin Panel**: ✅ Updated
   - Enhanced founding member display
   - Manual transition button
   - Status indicators and countdown

## 🔧 **Next Steps to Complete Setup**

### **Step 1: Update Existing Founding Members**

Run this SQL in the **Supabase Dashboard SQL Editor**:

```sql
-- Update existing founding members with purchase dates
UPDATE users 
SET 
  founding_member_purchased_at = created_at,
  updated_at = NOW()
WHERE 
  founding_member = true 
  AND founding_member_purchased_at IS NULL;

-- View the results
SELECT 
  email,
  founding_member_purchased_at,
  founding_member_transition_date,
  CASE
    WHEN founding_member_transitioned_at IS NOT NULL THEN 'Transitioned'
    WHEN founding_member_transition_date IS NOT NULL AND NOW() > founding_member_transition_date THEN 'Expired - Needs Transition'
    WHEN founding_member_transition_date IS NOT NULL AND NOW() <= founding_member_transition_date THEN 'Active'
    ELSE 'Unknown'
  END AS status,
  CASE
    WHEN founding_member_transitioned_at IS NOT NULL THEN 0
    WHEN founding_member_transition_date IS NOT NULL THEN 
      GREATEST(0, EXTRACT(EPOCH FROM (founding_member_transition_date - NOW())) / 86400)::INTEGER
    ELSE NULL
  END AS days_remaining
FROM users 
WHERE founding_member = true
ORDER BY founding_member_purchased_at;
```

### **Step 2: Test the System**

1. **Check Admin Panel**:
   - Go to: https://www.uselinky.app/admin/users
   - Click "View Details" on Tyler Amos
   - Verify founding member status is displayed correctly
   - Look for "Transition to Prospector" button

2. **Test Manual Transition**:
   - Click the "Transition to Prospector" button
   - Verify it creates a new Stripe subscription
   - Check that the user status updates

3. **Test Email Notifications**:
   - Check if transition notification emails are sent
   - Verify email content is correct

### **Step 3: Set Up Daily Cron Job**

**Option A: Using Supabase Cron (Recommended)**

Add this to your Supabase project:

1. Go to **Supabase Dashboard** → **Database** → **Cron Jobs**
2. Create a new cron job:
   - **Name**: `check-founding-member-transitions`
   - **Schedule**: `0 9 * * *` (Daily at 9 AM)
   - **SQL Command**:
   ```sql
   SELECT net.http_post(
     url := 'https://jydldvvsxwosyzwttmui.supabase.co/functions/v1/check-founding-member-transitions',
     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}',
     body := '{}'
   );
   ```

**Option B: External Cron Service**

Use a service like cron-job.org or GitHub Actions to call:
```
POST https://jydldvvsxwosyzwttmui.supabase.co/functions/v1/check-founding-member-transitions
```

### **Step 4: Monitor and Verify**

1. **Check Daily Logs**:
   - Monitor Supabase Edge Function logs
   - Check for any transition errors
   - Verify emails are being sent

2. **Monitor Founding Members**:
   ```sql
   -- Check who needs transition
   SELECT * FROM founding_members_needing_transition;
   
   -- Check overall status
   SELECT * FROM founding_member_status_overview;
   ```

3. **Verify Stripe Integration**:
   - Check Stripe dashboard for new subscriptions
   - Verify billing is working correctly
   - Monitor for any payment failures

## 🎯 **Expected Behavior**

### **For Active Founding Members**:
- Shows "Founding Member ($25/3mo)" with expiration date
- Displays countdown of days remaining
- "Transition to Prospector" button available

### **For Expired Founding Members**:
- Shows "Expired - needs transition"
- "Transition to Prospector" button available
- Will be automatically processed by daily cron

### **For Transitioned Members**:
- Shows "Prospector ($75/month)"
- Displays "Transitioned from Founding Member"
- No transition button (already completed)

## 🔍 **Troubleshooting**

### **If Transitions Aren't Working**:
1. Check Edge Function logs in Supabase Dashboard
2. Verify Stripe API keys are set correctly
3. Check if users have `stripe_customer_id`
4. Verify the `price_75_monthly` product exists in Stripe

### **If Emails Aren't Sending**:
1. Check `RESEND_API_KEY` is set in Supabase
2. Verify email function logs
3. Check spam folders

### **If Admin Panel Shows Errors**:
1. Clear browser cache
2. Check browser console for JavaScript errors
3. Verify the latest code is deployed

## 📞 **Support**

If you encounter issues:
1. Check the Supabase Edge Function logs
2. Verify all environment variables are set
3. Test with the manual transition button first
4. Check Stripe dashboard for subscription status

---

**🎉 The founding member transition system is now ready for production!** 