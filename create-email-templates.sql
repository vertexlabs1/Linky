-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content) VALUES
(
  'Welcome Email',
  '🎉 Welcome to Linky! 🚀',
  '<!DOCTYPE html><html><head><title>Welcome to Linky</title></head><body><h1>Welcome to Linky!</h1><p>Thank you for joining our waitlist.</p></body></html>'
),
(
  'Founding Member Email',
  '🎉 YOU''RE A LINKY FOUNDING MEMBER! 🚀',
  '<!DOCTYPE html><html><head><title>Welcome to Linky - Founding Member!</title></head><body><h1>Congratulations!</h1><p>You''re now a founding member!</p></body></html>'
),
(
  'Password Reset Email',
  '🔐 Reset Your Linky Password',
  '<!DOCTYPE html><html><head><title>Reset Your Linky Password</title></head><body><h1>Reset Your Password</h1><p>Click the link to reset your password.</p></body></html>'
);

-- Create RLS policies for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (for admin dashboard)
CREATE POLICY "Allow read access to email templates" ON email_templates
  FOR SELECT USING (true);

-- Allow update access to authenticated users (for admin dashboard)
CREATE POLICY "Allow update access to email templates" ON email_templates
  FOR UPDATE USING (true);

-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON email_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 