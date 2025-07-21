# 🚨 IMMEDIATE EMAIL FIX

## **Problem:**
User completed checkout but didn't receive password setup email.

## **Quick Fix Steps:**

### **Step 1: Check Supabase Secrets**
```bash
# Check if Resend API key is set
supabase secrets list | grep RESEND
```

### **Step 2: Set Resend API Key (if missing)**
```bash
# Add your Resend API key
supabase secrets set RESEND_API_KEY=your_actual_resend_key_here
```

### **Step 3: Deploy Email Functions**
```bash
# Deploy the email functions
supabase functions deploy send-founding-member-email
supabase functions deploy send-welcome-email
supabase functions deploy send-password-reset
```

### **Step 4: Manual Email Send (IMMEDIATE)**
For the user who didn't get email:

1. **Go to Admin Dashboard:**
   - Visit: https://www.uselinky.app/admin
   - Login with: tyler@vxlabs.co

2. **Find the User:**
   - Look in "Founding Members" section
   - Find the user who completed checkout

3. **Resend Email:**
   - Click "Resend Welcome Email" button
   - This should send the password setup email

### **Step 5: Alternative Manual Setup**
If admin dashboard doesn't work:

1. **Direct Password Setup:**
   - Go to: https://www.uselinky.app/setup-password
   - Use the user's email and session ID from Stripe

2. **Database Update (if needed):**
   ```sql
   -- Update user to mark password as set
   UPDATE users 
   SET password_set = true, email_verified = true 
   WHERE email = 'user_email_here';
   ```

## **Testing Email System:**

### **Test Email Function:**
```bash
curl -X POST https://jydldvvsxwosyzwttmui.supabase.co/functions/v1/send-founding-member-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User", 
    "sessionId": "test_session"
  }'
```

## **Expected Result:**
User should receive a beautiful founding member email with:
- ✅ Confetti animations
- ✅ Password setup link
- ✅ Founding member benefits
- ✅ Professional branding

## **If Still Not Working:**
1. Check Supabase Edge Functions logs
2. Verify Resend API key is valid
3. Test email function manually
4. Check webhook configuration in Stripe 