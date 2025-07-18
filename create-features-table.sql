-- Create features table for feature requests and roadmap
CREATE TABLE IF NOT EXISTS features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Feature details
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('automation', 'integrations', 'search', 'templates', 'platform', 'collaboration', 'analytics', 'other')),
  
  -- Status tracking
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'under_review', 'building', 'testing', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Access control
  availability TEXT DEFAULT 'none' CHECK (availability IN ('none', 'founding_members', 'beta_users', 'pro_users', 'all_users')),
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  estimated_completion DATE,
  
  -- Engagement metrics
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  
  -- Metadata
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to TEXT, -- Can be team member name or team
  internal_notes TEXT, -- Private notes for development team
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create feature_votes table to track individual user votes
CREATE TABLE IF NOT EXISTS feature_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one vote per user per feature
  UNIQUE(feature_id, user_id)
);

-- Create feature_comments table for user feedback
CREATE TABLE IF NOT EXISTS feature_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- For internal team comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
CREATE INDEX IF NOT EXISTS idx_features_priority ON features(priority);
CREATE INDEX IF NOT EXISTS idx_features_availability ON features(availability);
CREATE INDEX IF NOT EXISTS idx_features_submitted_by ON features(submitted_by);
CREATE INDEX IF NOT EXISTS idx_features_created_at ON features(created_at);

CREATE INDEX IF NOT EXISTS idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_votes_user_id ON feature_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_feature_comments_feature_id ON feature_comments(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_comments_user_id ON feature_comments(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update feature comments updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_features_updated_at 
    BEFORE UPDATE ON features 
    FOR EACH ROW 
    EXECUTE FUNCTION update_features_updated_at();

CREATE TRIGGER update_feature_comments_updated_at 
    BEFORE UPDATE ON feature_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_feature_comments_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for features table
CREATE POLICY "Anyone can view features" ON features
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create features" ON features
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own features" ON features
    FOR UPDATE USING (auth.uid() = submitted_by);

CREATE POLICY "Service role can manage all features" ON features
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for feature_votes table
CREATE POLICY "Anyone can view feature votes" ON feature_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON feature_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON feature_votes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for feature_comments table
CREATE POLICY "Anyone can view public feature comments" ON feature_comments
    FOR SELECT USING (is_internal = FALSE);

CREATE POLICY "Authenticated users can view their own comments" ON feature_comments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create comments" ON feature_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON feature_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all comments" ON feature_comments
    FOR ALL USING (auth.role() = 'service_role');

-- Insert some sample features for the roadmap
INSERT INTO features (name, description, category, status, priority, availability, progress_percentage, estimated_completion) VALUES
('LinkedIn Profile Scraping', 'Extract comprehensive profile data including work history, education, and contact information', 'automation', 'building', 'high', 'founding_members', 75, '2024-02-15'),
('Advanced Search Filters', 'Add industry, company size, location, and experience level filters to prospect search', 'search', 'building', 'high', 'founding_members', 60, '2024-02-28'),
('Message Templates', 'Pre-built templates for connection requests, follow-ups, and outreach messages', 'templates', 'testing', 'medium', 'founding_members', 90, '2024-02-10'),
('CRM Integration', 'Two-way sync with popular CRMs like Salesforce, HubSpot, and Pipedrive', 'integrations', 'requested', 'high', 'pro_users', 0, '2024-03-15'),
('Team Collaboration', 'Share prospect lists, message templates, and campaign results with team members', 'collaboration', 'requested', 'medium', 'pro_users', 0, '2024-04-01'),
('Advanced Analytics', 'Detailed reporting on message response rates, connection acceptance, and campaign performance', 'analytics', 'requested', 'medium', 'all_users', 0, '2024-03-30'),
('Chrome Extension', 'One-click prospect addition and messaging directly from LinkedIn pages', 'platform', 'under_review', 'high', 'all_users', 20, '2024-03-20'),
('Bulk Actions', 'Send messages, connection requests, and follow-ups to multiple prospects at once', 'automation', 'completed', 'high', 'founding_members', 100, NULL),
('Export to CSV', 'Export prospect lists and campaign data to CSV for external analysis', 'platform', 'completed', 'medium', 'all_users', 100, NULL),
('Email Finder', 'Automatically find and verify email addresses for LinkedIn prospects', 'automation', 'building', 'high', 'founding_members', 40, '2024-03-10');

-- Update upvotes for features to make them more realistic
UPDATE features SET upvotes = FLOOR(RANDOM() * 50) + 1;

COMMENT ON TABLE features IS 'Feature requests and roadmap items for the Linky platform';
COMMENT ON TABLE feature_votes IS 'User votes on feature requests';
COMMENT ON TABLE feature_comments IS 'Comments and feedback on feature requests'; 