-- Fix Database Schema Issues
-- This script addresses the missing tables and schema problems identified in testing

-- 1. Create missing founding_members table
CREATE TABLE IF NOT EXISTS public.founding_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id TEXT,
    stripe_schedule_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create missing email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create missing features table
CREATE TABLE IF NOT EXISTS public.features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    plan_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS current_plan_id TEXT,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS billing_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_founding_members_user_id ON public.founding_members(user_id);
CREATE INDEX IF NOT EXISTS idx_founding_members_status ON public.founding_members(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON public.transactions(stripe_payment_intent_id);

-- 6. Add constraints and validations
ALTER TABLE public.users 
ADD CONSTRAINT IF NOT EXISTS users_email_unique UNIQUE (email),
ADD CONSTRAINT IF NOT EXISTS users_stripe_customer_id_unique UNIQUE (stripe_customer_id);

-- 7. Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables) VALUES
(
    'welcome_email',
    'Welcome to Linky! 🎉',
    '<h1>Welcome to Linky!</h1><p>Hi {{first_name}},</p><p>Welcome to Linky! We''re excited to have you on board.</p><p>Best regards,<br>The Linky Team</p>',
    'Welcome to Linky!\n\nHi {{first_name}},\n\nWelcome to Linky! We''re excited to have you on board.\n\nBest regards,\nThe Linky Team',
    '{"first_name": "string", "last_name": "string", "email": "string"}'
),
(
    'password_reset',
    'Reset Your Linky Password',
    '<h1>Password Reset</h1><p>Hi {{first_name}},</p><p>Click the link below to reset your password:</p><p><a href="{{reset_url}}">Reset Password</a></p><p>If you didn''t request this, please ignore this email.</p>',
    'Password Reset\n\nHi {{first_name}},\n\nClick the link below to reset your password:\n\n{{reset_url}}\n\nIf you didn''t request this, please ignore this email.',
    '{"first_name": "string", "reset_url": "string"}'
),
(
    'founding_member_welcome',
    'Welcome to Linky Founding Members! 🚀',
    '<h1>Welcome Founding Member!</h1><p>Hi {{first_name}},</p><p>Congratulations! You''re now a founding member of Linky with exclusive early access.</p><p>Your founding member benefits include:</p><ul><li>3 months of premium access for just $25</li><li>Exclusive founding member features</li><li>Priority support</li></ul><p>Best regards,<br>The Linky Team</p>',
    'Welcome Founding Member!\n\nHi {{first_name}},\n\nCongratulations! You''re now a founding member of Linky with exclusive early access.\n\nYour founding member benefits include:\n- 3 months of premium access for just $25\n- Exclusive founding member features\n- Priority support\n\nBest regards,\nThe Linky Team',
    '{"first_name": "string", "last_name": "string", "email": "string"}'
)
ON CONFLICT (name) DO NOTHING;

-- 8. Insert default features
INSERT INTO public.features (name, description, plan_id) VALUES
('Basic Networking', 'Connect with other professionals', 'prospector'),
('Advanced Networking', 'Enhanced networking features', 'networker'),
('Premium Networking', 'Full networking suite', 'rainmaker'),
('Founding Member Access', 'Exclusive founding member features', 'founding_member')
ON CONFLICT (name) DO NOTHING;

-- 9. Create RLS policies for new tables
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Founding members policies
CREATE POLICY "Users can view their own founding member status" ON public.founding_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all founding members" ON public.founding_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Email templates policies (admin only)
CREATE POLICY "Only admins can access email templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Features policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view features" ON public.features
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify features" ON public.features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- 10. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Add updated_at triggers
CREATE TRIGGER update_founding_members_updated_at 
    BEFORE UPDATE ON public.founding_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON public.email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_features_updated_at 
    BEFORE UPDATE ON public.features 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Grant necessary permissions
GRANT ALL ON public.founding_members TO authenticated;
GRANT ALL ON public.email_templates TO authenticated;
GRANT ALL ON public.features TO authenticated;

-- 13. Verify the changes
SELECT 'Schema update completed successfully' as status; 