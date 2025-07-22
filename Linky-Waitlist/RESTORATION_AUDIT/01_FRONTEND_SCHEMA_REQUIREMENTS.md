# 01 – Frontend Derived Schema Requirements (Initial Draft)
 
## auth.users (core Supabase table)
- `id` (uuid, PK)
- `email` (text)
- `created_at` (timestamptz)
- `user_metadata` (jsonb)   ← **MISSING**
- `phone` (text)             ← **MISSING**
- `company` (text)           ← **MISSING**
- `job_title` (text)         ← **MISSING**
 
## public.users (custom profile table – NOT PRESENT)
- `id` (uuid PK, default gen_random_uuid())
- `auth_user_id` (uuid FK → auth.users.id, unique)
- `first_name` (text)
- `last_name` (text)
- `email` (text, unique)
- `phone` (text)
- `company` (text)
- `job_title` (text)
- `founding_member` (boolean, default false)
- `subscription_plan` (text)
- `subscription_status` (text)
- `stripe_customer_id` (text)
- `created_at` (timestamptz, default now())

Additional columns will be appended as components are audited (Settings.tsx, AdminDashboard, etc.).
