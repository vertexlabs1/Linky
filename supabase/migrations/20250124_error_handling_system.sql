-- COMPREHENSIVE ERROR HANDLING & RETRY SYSTEM
-- This migration adds robust error tracking, retry mechanisms, and monitoring

-- 1. ERROR LOGS TABLE
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL, -- 'webhook_failure', 'email_failure', 'payment_failure', etc.
    error_message TEXT NOT NULL,
    error_details JSONB,
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    stripe_session_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'success', 'failed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 2. EMAIL DELIVERY TRACKING
CREATE TABLE IF NOT EXISTS email_delivery_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_type VARCHAR(100) NOT NULL, -- 'founding_member_welcome', 'password_reset', 'plan_change', etc.
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    resend_email_id VARCHAR(255),
    subject VARCHAR(500),
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'spam', 'failed'
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
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'success', 'failed', 'retry'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SYSTEM HEALTH MONITORING
CREATE TABLE IF NOT EXISTS system_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_type VARCHAR(100) NOT NULL, -- 'webhook_health', 'email_health', 'payment_health', 'database_health'
    status VARCHAR(50) NOT NULL, -- 'healthy', 'warning', 'critical', 'down'
    details JSONB,
    last_check_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RETRY QUEUE FOR FAILED OPERATIONS
CREATE TABLE IF NOT EXISTS retry_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type VARCHAR(100) NOT NULL, -- 'send_email', 'process_webhook', 'update_user', etc.
    operation_data JSONB NOT NULL,
    priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'success', 'failed', 'cancelled'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. EMAIL DELIVERABILITY SETTINGS
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
('spam_prevention_enabled', 'true', 'Whether to use spam prevention measures'),
('dkim_enabled', 'true', 'Whether DKIM signing is enabled'),
('spf_enabled', 'true', 'Whether SPF records are configured'),
('dmarc_enabled', 'true', 'Whether DMARC is configured');

-- 7. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type, created_at);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_email ON email_delivery_logs(recipient_email, created_at);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status ON email_delivery_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(processing_status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_retry_queue_status ON retry_queue(status, next_retry_at, priority);
CREATE INDEX IF NOT EXISTS idx_retry_queue_type ON retry_queue(operation_type, created_at);

-- 8. FUNCTIONS FOR AUTOMATED RETRY LOGIC
CREATE OR REPLACE FUNCTION process_retry_queue()
RETURNS INTEGER AS $$
DECLARE
    retry_count INTEGER := 0;
    queue_item RECORD;
BEGIN
    -- Process high priority items first
    FOR queue_item IN 
        SELECT * FROM retry_queue 
        WHERE status = 'pending' 
        AND next_retry_at <= NOW()
        ORDER BY priority DESC, created_at ASC
        LIMIT 10
    LOOP
        BEGIN
            -- Mark as processing
            UPDATE retry_queue 
            SET status = 'processing', updated_at = NOW()
            WHERE id = queue_item.id;
            
            -- Process based on operation type
            CASE queue_item.operation_type
                WHEN 'send_email' THEN
                    -- Call email function
                    PERFORM send_email_from_queue(queue_item.operation_data);
                WHEN 'process_webhook' THEN
                    -- Process webhook
                    PERFORM process_webhook_from_queue(queue_item.operation_data);
                WHEN 'update_user' THEN
                    -- Update user status
                    PERFORM update_user_from_queue(queue_item.operation_data);
                ELSE
                    -- Unknown operation type
                    UPDATE retry_queue 
                    SET status = 'failed', error_message = 'Unknown operation type: ' || queue_item.operation_type
                    WHERE id = queue_item.id;
            END CASE;
            
            -- Mark as success
            UPDATE retry_queue 
            SET status = 'success', completed_at = NOW(), updated_at = NOW()
            WHERE id = queue_item.id;
            
            retry_count := retry_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Handle failure
            UPDATE retry_queue 
            SET 
                status = CASE 
                    WHEN retry_count >= queue_item.max_retries THEN 'failed'
                    ELSE 'pending'
                END,
                retry_count = retry_count + 1,
                next_retry_at = NOW() + INTERVAL '5 minutes' * (retry_count + 1),
                error_message = SQLERRM,
                updated_at = NOW()
            WHERE id = queue_item.id;
        END;
    END LOOP;
    
    RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

-- 9. TRIGGERS FOR AUTOMATIC ERROR LOGGING
CREATE OR REPLACE FUNCTION log_error_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Log errors automatically
    INSERT INTO error_logs (
        error_type,
        error_message,
        error_details,
        user_id,
        email,
        stripe_session_id,
        stripe_customer_id
    ) VALUES (
        TG_ARGV[0],
        NEW.error_message,
        NEW.error_details,
        NEW.user_id,
        NEW.email,
        NEW.stripe_session_id,
        NEW.stripe_customer_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. VIEWS FOR MONITORING
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

-- 11. COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE error_logs IS 'Comprehensive error tracking for all system failures';
COMMENT ON TABLE email_delivery_logs IS 'Email delivery tracking and analytics';
COMMENT ON TABLE webhook_logs IS 'Stripe webhook processing logs';
COMMENT ON TABLE system_health IS 'System health monitoring and status';
COMMENT ON TABLE retry_queue IS 'Automatic retry queue for failed operations';
COMMENT ON TABLE email_settings IS 'Email configuration and deliverability settings'; 