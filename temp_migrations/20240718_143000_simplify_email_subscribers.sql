-- Simplify email_subscribers table - replace complex status with simple active boolean
-- Drop existing views and functions first
DROP VIEW IF EXISTS active_subscribers;
DROP VIEW IF EXISTS waitlist_stats;
DROP FUNCTION IF EXISTS handle_duplicate_subscriber;

-- Add active column and migrate existing data
ALTER TABLE email_subscribers 
ADD COLUMN active BOOLEAN DEFAULT TRUE;

-- Migrate existing status data to active column
UPDATE email_subscribers 
SET active = CASE 
    WHEN status = 'active' THEN TRUE
    ELSE FALSE
END;

-- Drop the old status column
ALTER TABLE email_subscribers DROP COLUMN status;

-- Drop the old source column (not needed for simple waitlist)
ALTER TABLE email_subscribers DROP COLUMN source;

-- Drop unnecessary columns for simple waitlist
ALTER TABLE email_subscribers DROP COLUMN preferences;
ALTER TABLE email_subscribers DROP COLUMN confirmed_at;
ALTER TABLE email_subscribers DROP COLUMN last_email_sent_at;
ALTER TABLE email_subscribers DROP COLUMN last_opened_at;

-- Update indexes
DROP INDEX IF EXISTS idx_email_subscribers_status;
DROP INDEX IF EXISTS idx_email_subscribers_source;
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(active);

-- Create simple view for active subscribers
CREATE VIEW active_subscribers AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM email_subscribers 
WHERE active = TRUE;

-- Create simple waitlist stats view
CREATE VIEW waitlist_stats AS
SELECT 
    COUNT(*) as total_signups,
    COUNT(CASE WHEN active = TRUE THEN 1 END) as active_signups,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as signups_last_7_days,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as signups_last_30_days
FROM email_subscribers;

-- Grant permissions
GRANT SELECT ON active_subscribers TO service_role;
GRANT SELECT ON waitlist_stats TO service_role;
GRANT ALL ON email_subscribers TO service_role;

-- Create simple function to handle duplicate email signups
CREATE OR REPLACE FUNCTION handle_duplicate_subscriber(
    p_email TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
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
        -- Email exists, update info if needed and reactivate if inactive
        UPDATE email_subscribers 
        SET 
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            active = TRUE,
            updated_at = NOW()
        WHERE email = p_email
        RETURNING id INTO new_subscriber_id;
        
        RETURN QUERY SELECT 
            new_subscriber_id,
            FALSE as is_new_signup,
            CASE 
                WHEN existing_subscriber.active = FALSE THEN 'Reactivated subscription'
                ELSE 'Already subscribed'
            END as message;
    ELSE
        -- New email, insert new subscriber
        INSERT INTO email_subscribers (
            email,
            first_name,
            last_name,
            ip_address,
            user_agent,
            referrer
        ) VALUES (
            p_email,
            p_first_name,
            p_last_name,
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