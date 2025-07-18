-- Create email_templates table for admin dashboard
CREATE TABLE IF NOT EXISTS public.email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'html',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all authenticated users to read email templates
CREATE POLICY "Email templates are readable by authenticated users" ON public.email_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create a policy that allows service role to manage templates
CREATE POLICY "Email templates are manageable by service role" ON public.email_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, body, type) VALUES
(
    'welcome_email',
    'Welcome to Linky! 🎉',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Linky!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Linky!</h1>
            <p>Turn LinkedIn Likes into Real Business</p>
        </div>
        <div class="content">
            <p>Hi {{firstName}},</p>
            <p>Thank you for joining our waitlist! You''re now part of an exclusive group that will get early access to Linky - the revolutionary platform that helps you convert LinkedIn engagement into real business opportunities.</p>
            <p><strong>What''s next?</strong></p>
            <ul>
                <li>We''ll keep you updated on our development progress</li>
                <li>You''ll be among the first to know when we launch</li>
                <li>Early access to exclusive features and pricing</li>
            </ul>
            <p>Stay tuned for exciting updates!</p>
            <p>Best regards,<br>The Linky Team</p>
        </div>
    </div>
</body>
</html>',
    'html'
),
(
    'founding_member_email',
    '👑 Welcome to the Linky Founding Members! 🎉',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Founding Member Welcome</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .badge { background: #ffd700; color: #333; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
        .button { display: inline-block; background: #ffd700; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👑 Congratulations, Founding Member!</h1>
            <div class="badge">Founding Member #{{memberNumber}}</div>
            <p>You''re part of Linky''s exclusive founding circle!</p>
        </div>
        <div class="content">
            <p>Hi {{firstName}},</p>
            <p>🎉 <strong>Welcome to the Linky Founding Members!</strong> 🎉</p>
            <p>You''ve just secured your spot as one of our exclusive founding members. This means you''ll get:</p>
            <ul>
                <li><strong>Special Founding Member Pricing</strong> - Lock in your rate forever</li>
                <li><strong>Priority Support</strong> - Direct line to our team</li>
                <li><strong>Early Access</strong> - First to try new features</li>
                <li><strong>Founding Member Badge</strong> - Recognition in our community</li>
            </ul>
            <p><strong>Next Steps:</strong></p>
            <p>Set up your account password to get started:</p>
            <a href="{{passwordSetupLink}}" class="button">Set Up Your Account</a>
            <p>Thank you for believing in our vision and being part of the Linky founding story!</p>
            <p>Best regards,<br>The Linky Team</p>
        </div>
    </div>
</body>
</html>',
    'html'
)
ON CONFLICT (name) DO NOTHING;

-- Create an update trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.email_templates IS 'Email templates for automated emails sent by the application';
COMMENT ON COLUMN public.email_templates.name IS 'Unique identifier for the template (e.g., welcome_email, founding_member_email)';
COMMENT ON COLUMN public.email_templates.subject IS 'Email subject line (supports {{variable}} placeholders)';
COMMENT ON COLUMN public.email_templates.body IS 'Email body content (supports {{variable}} placeholders)';
COMMENT ON COLUMN public.email_templates.type IS 'Template type (html, text, markdown)'; 