-- Create email_subscribers table for waitlist and newsletter
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic subscriber info
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  
  -- Subscription details
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'pending')),
  source TEXT DEFAULT 'waitlist' CHECK (source IN ('waitlist', 'newsletter', 'founding_member', 'manual', 'import')),
  
  -- Preferences (for future newsletter features)
  preferences JSONB DEFAULT '{}',
  
  -- Engagement tracking
  confirmed_at TIMESTAMP WITH TIME ZONE,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON email_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON email_subscribers(source);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_created_at ON email_subscribers(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_subscribers_updated_at 
    BEFORE UPDATE ON email_subscribers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_email_subscribers_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Allow service role to manage all subscribers (for admin/API operations)
CREATE POLICY "Service role can manage all subscribers" ON email_subscribers
    FOR ALL USING (auth.role() = 'service_role');

-- 2. Allow public to insert (for waitlist signup)
CREATE POLICY "Allow public waitlist signup" ON email_subscribers
    FOR INSERT WITH CHECK (source = 'waitlist');

-- 3. Restrict read access to service role only (privacy protection)
CREATE POLICY "Restrict subscriber data access" ON email_subscribers
    FOR SELECT USING (auth.role() = 'service_role');

-- Create views for different use cases

-- View for active subscribers (for newsletter)
CREATE VIEW active_subscribers AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    source,
    preferences,
    confirmed_at,
    created_at
FROM email_subscribers 
WHERE status = 'active';

-- View for waitlist analytics
CREATE VIEW waitlist_stats AS
SELECT 
    COUNT(*) as total_signups,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) as confirmed_signups,
    COUNT(CASE WHEN source = 'waitlist' THEN 1 END) as waitlist_signups,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as signups_last_7_days,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as signups_last_30_days
FROM email_subscribers 
WHERE status = 'active';

-- Grant permissions
GRANT SELECT ON active_subscribers TO service_role;
GRANT SELECT ON waitlist_stats TO service_role;
GRANT ALL ON email_subscribers TO service_role;

-- Create function to handle duplicate email signups
CREATE OR REPLACE FUNCTION handle_duplicate_subscriber(
    p_email TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'waitlist',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS TABLE(
    subscriber_id UUID,
    is_new_signup BOOLEAN,
    message TEXT
) AS $$
DECLARE
    existing_subscriber email_subscribers%ROWTYPE;
    new_subscriber_id UUID;
BEGIN
    -- Check if email already exists
    SELECT * INTO existing_subscriber FROM email_subscribers WHERE email = p_email;
    
    IF FOUND THEN
        -- Email exists, update info if needed and reactivate if unsubscribed
        UPDATE email_subscribers 
        SET 
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            status = CASE 
                WHEN status = 'unsubscribed' THEN 'active'
                ELSE status
            END,
            updated_at = NOW()
        WHERE email = p_email
        RETURNING id INTO new_subscriber_id;
        
        RETURN QUERY SELECT 
            new_subscriber_id,
            FALSE as is_new_signup,
            CASE 
                WHEN existing_subscriber.status = 'unsubscribed' THEN 'Reactivated subscription'
                ELSE 'Already subscribed'
            END as message;
    ELSE
        -- New email, insert new subscriber
        INSERT INTO email_subscribers (
            email,
            first_name,
            last_name,
            source,
            ip_address,
            user_agent,
            referrer
        ) VALUES (
            p_email,
            p_first_name,
            p_last_name,
            p_source,
            p_ip_address,
            p_user_agent,
            p_referrer
        ) RETURNING id INTO new_subscriber_id;
        
        RETURN QUERY SELECT 
            new_subscriber_id,
            TRUE as is_new_signup,
            'Successfully added to waitlist' as message;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 