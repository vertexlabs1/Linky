-- Configure Supabase Auth to use custom email settings
-- This needs to be done through the Supabase Dashboard

-- Go to: https://supabase.com/dashboard/project/jydldvvsxwosyzwttmui/auth/settings

-- Configure the following settings:

-- 1. Site URL: https://www.uselinky.app
-- 2. Redirect URLs: 
--    - https://www.uselinky.app/setup-password
--    - https://www.uselinky.app/dashboard
--    - https://www.uselinky.app/

-- 3. Email Templates:
--    - Customize the "Password Reset" template to use our branding
--    - Set the "From" email to: no-reply@uselinky.app
--    - Set the "From" name to: Linky

-- 4. SMTP Settings (if available):
--    - SMTP Host: smtp.resend.com
--    - SMTP Port: 587
--    - Username: resend
--    - Password: [Your Resend API Key]
--    - From Email: no-reply@uselinky.app

-- Note: The exact configuration depends on your Supabase plan and available features.
-- For now, the password reset will work with Supabase's default email,
-- but you can customize the email templates in the Supabase Dashboard. 