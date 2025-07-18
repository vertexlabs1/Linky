-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (since this is admin-only functionality)
CREATE POLICY "Email templates are readable by all" ON public.email_templates
    FOR SELECT USING (true);

CREATE POLICY "Email templates are manageable by all" ON public.email_templates
    FOR ALL USING (true);

-- Create update trigger
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

-- Insert sample templates
INSERT INTO public.email_templates (name, description, subject, html_content, variables, category, is_active) VALUES
(
    'welcome_email',
    'Welcome email for new waitlist subscribers',
    'Welcome to Linky! 🎉',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Linky!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
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
            <p>Thank you for joining our waitlist! You''re now part of an exclusive group that will get early access to Linky.</p>
            <h3>What''s next?</h3>
            <ul>
                <li>We''ll keep you updated on our development progress</li>
                <li>You''ll be among the first to know when we launch</li>
                <li>Early access to exclusive features and pricing</li>
            </ul>
            <p>Stay tuned for exciting updates!</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The Linky Team</p>
        </div>
    </div>
</body>
</html>',
    '["firstName"]'::jsonb,
    'onboarding',
    true
),
(
    'founding_member_email',
    'Spectacular founding member welcome email with confetti',
    '👑 YOU''RE A LINKY FOUNDING MEMBER! 🚀',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Founding Member Welcome</title>
    <style>
        @keyframes confetti {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6; color: #333; margin: 0; padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .confetti {
            position: fixed; width: 10px; height: 10px; background: #fbbf24;
            animation: confetti 3s linear infinite; z-index: 1000;
        }
        .container { 
            max-width: 600px; margin: 0 auto; background: white; 
            border-radius: 20px; overflow: hidden; 
            box-shadow: 0 25px 50px rgba(0,0,0,0.15); position: relative; z-index: 1;
        }
        .header { 
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
            padding: 50px 30px; text-align: center; color: #1f2937;
        }
        .logo { font-size: 36px; font-weight: bold; margin-bottom: 15px; }
        .logo-icon {
            background: #1f2937; color: #fbbf24; padding: 12px 16px;
            border-radius: 12px; font-size: 28px; animation: bounce 2s ease-in-out infinite;
        }
        .content { padding: 50px 30px; }
        .welcome-text { 
            font-size: 32px; font-weight: 700; color: #1f2937; 
            margin-bottom: 25px; text-align: center;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .celebration-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 30px; border-radius: 16px; margin: 40px 0;
            border: 3px solid #fbbf24; text-align: center;
        }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
            color: #1f2937; padding: 20px 40px; text-decoration: none; 
            border-radius: 50px; font-weight: 700; font-size: 18px;
            margin: 20px 0; box-shadow: 0 10px 25px rgba(251, 191, 36, 0.4);
        }
        .footer { background: #f8fafc; padding: 40px 30px; text-align: center; color: #6b7280; }
    </style>
</head>
<body>
    <div class="confetti" style="left: 10%;"></div>
    <div class="confetti" style="left: 30%;"></div>
    <div class="confetti" style="left: 50%;"></div>
    <div class="confetti" style="left: 70%;"></div>
    <div class="confetti" style="left: 90%;"></div>
    
    <div class="container">
        <div class="header">
            <div class="logo">
                <span class="logo-icon">👑</span> Linky
            </div>
            <p>Founding Member Exclusive</p>
        </div>
        
        <div class="content">
            <h1 class="welcome-text">CONGRATULATIONS, {{firstName}}! 🚀</h1>
            
            <div class="celebration-box">
                <h2 style="margin: 0 0 15px 0; color: #92400e;">
                    🎊 YOU''RE OFFICIALLY A FOUNDING MEMBER! 🎊
                </h2>
                <p style="margin: 0; color: #92400e;">
                    You''ve joined an exclusive club of visionaries!
                </p>
            </div>
            
            <p style="text-align: center; font-size: 18px; color: #6b7280;">
                We''re thrilled to have you as one of our <strong>FOUNDING MEMBERS</strong>!
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="{{passwordSetupUrl}}" class="cta-button">
                    ✨ CREATE MY PASSWORD ✨
                </a>
            </div>
            
            <p style="text-align: center; font-size: 20px; font-weight: 600; color: #1f2937;">
                Welcome to the Linky family! 🚀
            </p>
        </div>
        
        <div class="footer">
            <p><strong>The Linky Team</strong><br>Building the future of LinkedIn lead generation</p>
        </div>
    </div>
</body>
</html>',
    '["firstName", "passwordSetupUrl"]'::jsonb,
    'onboarding',
    true
)
ON CONFLICT (name) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE public.email_templates IS 'Email templates for automated emails sent by the application';
COMMENT ON COLUMN public.email_templates.name IS 'Unique identifier for the template';
COMMENT ON COLUMN public.email_templates.html_content IS 'HTML content with {{variable}} placeholders';
COMMENT ON COLUMN public.email_templates.variables IS 'JSON array of available variables for this template';
COMMENT ON COLUMN public.email_templates.category IS 'Template category (onboarding, marketing, etc.)';
COMMENT ON COLUMN public.email_templates.is_active IS 'Whether this template is currently active and usable'; 