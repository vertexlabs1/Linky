-- Create features table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
CREATE INDEX IF NOT EXISTS idx_features_availability ON features(availability);
CREATE INDEX IF NOT EXISTS idx_features_upvotes ON features(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_features_created_at ON features(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_votes_user_id ON feature_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_comments_feature_id ON feature_comments(feature_id);

-- Create function to update upvotes count
CREATE OR REPLACE FUNCTION update_feature_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE features 
    SET upvotes = upvotes + 1 
    WHERE id = NEW.feature_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE features 
    SET upvotes = upvotes - 1 
    WHERE id = OLD.feature_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update upvotes
CREATE TRIGGER trigger_update_feature_upvotes
  AFTER INSERT OR DELETE ON feature_votes
  FOR EACH ROW EXECUTE FUNCTION update_feature_upvotes();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW EXECUTE FUNCTION update_features_updated_at();

-- Enable Row Level Security
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for features table
-- Anyone can read features
CREATE POLICY "Anyone can view features" ON features
  FOR SELECT USING (true);

-- Authenticated users can insert feature requests
CREATE POLICY "Authenticated users can create features" ON features
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own submitted features (limited fields)
CREATE POLICY "Users can update own features" ON features
  FOR UPDATE USING (auth.uid() = submitted_by)
  WITH CHECK (auth.uid() = submitted_by);

-- RLS Policies for feature_votes table
-- Users can view all votes
CREATE POLICY "Anyone can view votes" ON feature_votes
  FOR SELECT USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can vote" ON feature_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can remove their votes" ON feature_votes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for feature_comments table
-- Anyone can read comments
CREATE POLICY "Anyone can view comments" ON feature_comments
  FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can comment" ON feature_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON feature_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON feature_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Insert some initial features
INSERT INTO features (name, description, category, status, priority, availability, progress_percentage, estimated_completion, upvotes) VALUES
('LinkedIn Profile Monitoring', 'Track engagement on your target prospects profiles and posts. Get notified when they are active or post new content.', 'automation', 'building', 'high', 'founding_members', 75, '2024-06-30', 24),
('AI Lead Scoring', 'Advanced AI algorithm that scores prospects 0-100 based on your ICP (industry, company size, location, role).', 'analytics', 'building', 'high', 'founding_members', 60, '2024-06-30', 31),
('Personalized Comment Generation', 'Generate 5 authentic, personalized comments in your voice for any LinkedIn post to boost engagement.', 'automation', 'under_review', 'medium', 'none', 30, '2024-09-30', 18),
('Dream Lead Tracker', 'Monitor your top prospects and get instant alerts when they engage, post updates, or show buying signals.', 'automation', 'requested', 'medium', 'none', 20, '2024-09-30', 27),
('Analytics Dashboard', 'Comprehensive insights into your LinkedIn outreach performance, engagement rates, and ROI tracking.', 'analytics', 'requested', 'medium', 'none', 15, '2024-12-31', 15),
('CRM Integration (HubSpot, Salesforce)', 'Sync lead data and activities with popular CRM platforms to maintain a single source of truth.', 'integrations', 'under_review', 'high', 'none', 25, '2024-09-30', 42),
('Bulk LinkedIn Connection Requests', 'Allow users to send connection requests to multiple prospects at once with personalized messages.', 'automation', 'building', 'high', 'beta_users', 45, '2024-08-31', 35),
('Mobile App', 'Native mobile application for iOS and Android to manage leads and engage on the go.', 'platform', 'requested', 'low', 'none', 5, '2025-06-30', 56),
('Team Collaboration Features', 'Share leads, assign tasks, and collaborate with team members on prospect management.', 'collaboration', 'requested', 'medium', 'none', 10, '2024-12-31', 22),
('Advanced Search Filters', 'More granular filtering options for prospects including job seniority, company growth stage, and geographic location.', 'search', 'under_review', 'medium', 'none', 35, '2024-08-31', 19);

-- Create view for feature requests with user information
CREATE OR REPLACE VIEW feature_requests_with_user AS
SELECT 
  f.*,
  u.first_name || ' ' || u.last_name AS submitted_by_name,
  u.email AS submitted_by_email,
  (SELECT COUNT(*) FROM feature_comments fc WHERE fc.feature_id = f.id) AS comment_count
FROM features f
LEFT JOIN users u ON f.submitted_by = u.id
ORDER BY f.upvotes DESC, f.created_at DESC; 