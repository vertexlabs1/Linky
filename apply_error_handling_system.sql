-- APPLY ERROR HANDLING SYSTEM MANUALLY
-- This script adds comprehensive error tracking and retry mechanisms

-- 1. ERROR LOGS TABLE
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    stripe_session_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 2. EMAIL DELIVERY TRACKING
CREATE TABLE IF NOT EXISTS email_delivery_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_type VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    resend_email_id VARCHAR(255),
    subject VARCHAR(500),
    status VARCHAR(50) DEFAULT 'sent',
    delivery_details JSONB,
    user_id UUID REFERENCES users(id),
    stripe_session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE
);

-- 3. WEBHOOK PROCESSING LOGS
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RETRY QUEUE FOR FAILED OPERATIONS
CREATE TABLE IF NOT EXISTS retry_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type VARCHAR(100) NOT NULL,
    operation_data JSONB NOT NULL,
    priority INTEGER DEFAULT 1,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. EMAIL SETTINGS
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email settings
INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('from_email', 'hello@uselinky.app', 'Default from email address'),
('reply_to_email', 'support@uselinky.app', 'Default reply-to email address'),
('max_retries', '3', 'Maximum number of email retry attempts'),
('retry_delay_minutes', '5', 'Delay between email retry attempts in minutes'),
('spam_prevention_enabled', 'true', 'Whether to use spam prevention measures')
ON CONFLICT (setting_key) DO NOTHING;

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type, created_at);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_email ON email_delivery_logs(recipient_email, created_at);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status ON email_delivery_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(processing_status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_retry_queue_status ON retry_queue(status, next_retry_at, priority);
CREATE INDEX IF NOT EXISTS idx_retry_queue_type ON retry_queue(operation_type, created_at);

-- 7. VIEWS FOR MONITORING
CREATE OR REPLACE VIEW system_health_dashboard AS
SELECT 
    'error_logs' as component,
    COUNT(*) as total_errors,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_errors,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_errors,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as errors_last_hour
FROM error_logs
UNION ALL
SELECT 
    'email_delivery' as component,
    COUNT(*) as total_emails,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_emails,
    COUNT(CASE WHEN status IN ('bounced', 'spam', 'failed') THEN 1 END) as failed_emails,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as emails_last_hour
FROM email_delivery_logs
UNION ALL
SELECT 
    'webhook_processing' as component,
    COUNT(*) as total_webhooks,
    COUNT(CASE WHEN processing_status = 'success' THEN 1 END) as successful_webhooks,
    COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_webhooks,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as webhooks_last_hour
FROM webhook_logs
UNION ALL
SELECT 
    'retry_queue' as component,
    COUNT(*) as total_retries,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_retries,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_retries,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as retries_last_hour
FROM retry_queue;

-- 8. COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE error_logs IS 'Comprehensive error tracking for all system failures';
COMMENT ON TABLE email_delivery_logs IS 'Email delivery tracking and analytics';
COMMENT ON TABLE webhook_logs IS 'Stripe webhook processing logs';
COMMENT ON TABLE retry_queue IS 'Automatic retry queue for failed operations';
COMMENT ON TABLE email_settings IS 'Email configuration and deliverability settings';

-- 9. LOG CURRENT SYSTEM STATUS
INSERT INTO error_logs (error_type, error_message, error_details, status, resolved_at)
VALUES ('system_setup', 'Error handling system initialized', 
        jsonb_build_object('tables_created', 5, 'indexes_created', 8, 'views_created', 1),
        'success', NOW());

-- 10. VERIFY SETUP
SELECT 'Error handling system setup complete' as status,
       (SELECT COUNT(*) FROM error_logs) as error_logs_count,
       (SELECT COUNT(*) FROM email_delivery_logs) as email_logs_count,
       (SELECT COUNT(*) FROM webhook_logs) as webhook_logs_count,
       (SELECT COUNT(*) FROM retry_queue) as retry_queue_count,
       (SELECT COUNT(*) FROM email_settings) as email_settings_count; 