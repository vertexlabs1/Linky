# 🗄️ Database Setup Guide

## 🎯 **Goal**: Complete the background agent's fixes by setting up the database

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Go to Supabase Dashboard**
1. **Navigate to**: https://supabase.com/dashboard/project/jydldvvsxwosyzwttmui
2. **Click on "SQL Editor"** in the left sidebar
3. **Click "New Query"**

### **Step 2: Run the Complete Migration**
1. **Copy the entire contents** of `complete-database-setup.sql`
2. **Paste it** into the SQL Editor
3. **Click "Run"** to execute the migration

### **Step 3: Verify the Setup**
After running the migration, you should see:
- ✅ **Success message**: "✅ Database setup completed successfully!"
- ✅ **Table counts**: Shows 0 rows for new tables (which is correct)
- ✅ **Column verification**: Shows the new columns were added to users table

---

## 🎯 **What This Migration Does**

### **1. Creates Payment History System**
- ✅ **`transactions` table** - Stores all payment history from Stripe
- ✅ **Proper indexes** - For fast queries and performance
- ✅ **Unique constraints** - Prevents duplicate transactions

### **2. Creates Audit Trail System**
- ✅ **`billing_changes` table** - Tracks all billing modifications
- ✅ **Admin actions** - Logs who made what changes and when

### **3. Creates Payment Methods System**
- ✅ **`payment_methods` table** - Stores customer payment methods
- ✅ **Card information** - Brand, last 4 digits, expiration

### **4. Enhances Users Table**
- ✅ **Promo tracking** - For founding member promotions
- ✅ **Billing information** - Separate from account information
- ✅ **Subscription tracking** - Period start/end, trial info
- ✅ **Sync tracking** - Last sync timestamp

### **5. Creates Helper Functions**
- ✅ **`log_billing_change()`** - Function to log billing changes
- ✅ **Views** - Easy-to-use views for payment history and methods

---

## 🧪 **Testing After Migration**

### **Test 1: Admin Panel Payment History**
1. Go to https://www.uselinky.app/admin
2. Login with `tyler@vxlabs.co`
3. Go to Users → Click "View Details" on a user
4. Click "Refresh Payment History"
5. **Expected**: Should work without errors (may show "no data" which is normal)

### **Test 2: Email System**
1. In the admin panel, try "Resend Welcome Email"
2. **Expected**: Should send email successfully

### **Test 3: User Management**
1. Test creating a new user
2. Test editing user information
3. **Expected**: All should work smoothly

---

## 🔍 **If Something Goes Wrong**

### **Common Issues:**

1. **"Table already exists" errors**
   - ✅ **Normal** - The `IF NOT EXISTS` clauses handle this
   - ✅ **Safe to ignore** - Tables are created only if they don't exist

2. **"Column already exists" errors**
   - ✅ **Normal** - The `IF NOT EXISTS` clauses handle this
   - ✅ **Safe to ignore** - Columns are added only if they don't exist

3. **Permission errors**
   - ❌ **Check**: Make sure you're logged into the correct Supabase project
   - ❌ **Check**: Verify you have admin access to the project

### **Verification Queries:**

After running the migration, you can run these to verify:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('transactions', 'billing_changes', 'payment_methods');

-- Check if columns were added to users table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('promo_active', 'billing_name', 'last_sync_at');
```

---

## 🎉 **Success Indicators**

After running the migration, you should see:

1. **✅ Success message** in the results
2. **✅ All tables created** (transactions, billing_changes, payment_methods)
3. **✅ All columns added** to users table
4. **✅ No error messages** (warnings about existing tables are normal)

---

## 🚀 **Next Steps**

After the database migration is complete:

1. **Test the admin panel** - Payment history should work
2. **Test email system** - Welcome emails should work
3. **Test user management** - All CRUD operations should work
4. **Monitor the system** - Check for any issues

**🎯 The background agent's fixes will be 100% complete after this migration!** 