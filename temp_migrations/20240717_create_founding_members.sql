-- Create founding_members table
CREATE TABLE IF NOT EXISTS founding_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  password_set BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_founding_members_email ON founding_members(email);

-- Create index for status lookups
CREATE INDEX IF NOT EXISTS idx_founding_members_status ON founding_members(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_founding_members_updated_at 
    BEFORE UPDATE ON founding_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE founding_members ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow users to read their own data
CREATE POLICY "Users can view own founding member data" ON founding_members
    FOR SELECT USING (auth.email() = email);

-- Allow service role to insert/update (for webhooks)
CREATE POLICY "Service role can manage founding members" ON founding_members
    FOR ALL USING (auth.role() = 'service_role');

-- Create a view for active founding members
CREATE VIEW active_founding_members AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    password_set,
    email_verified,
    created_at
FROM founding_members 
WHERE status = 'active' AND password_set = TRUE AND email_verified = TRUE;

-- Grant permissions
GRANT SELECT ON active_founding_members TO authenticated;
GRANT ALL ON founding_members TO service_role; 