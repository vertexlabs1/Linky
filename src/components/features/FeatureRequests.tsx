import { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Tag,
  Calendar,
  User,
  Wrench,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  availability: string;
  progress_percentage: number;
  estimated_completion: string | null;
  upvotes: number;
  submitted_by: string | null;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

interface UserVote {
  feature_id: string;
  user_id: string;
}

const FeatureRequests = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: '',
    priority: ''
  });

  useEffect(() => {
    fetchFeatures();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        fetchUserVotes(user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchUserVotes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('feature_votes')
        .select('feature_id, user_id')
        .eq('user_id', userId);

      if (error) throw error;
      setUserVotes(data || []);
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('features')
        .select(`
          *,
          users!features_submitted_by_fkey(first_name, last_name, email)
        `)
        .order('upvotes', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = (data || []).map(feature => ({
        ...feature,
        submitted_by_name: feature.users ? 
          `${feature.users.first_name || ''} ${feature.users.last_name || ''}`.trim() : null,
        submitted_by_email: feature.users?.email || null,
        comment_count: 0 // We'll add this later when comments are implemented
      }));

      setFeatures(transformedData);
    } catch (error) {
      console.error('Error fetching features:', error);
      // Fallback to demo data if database is not available
      setFeatures([
        {
          id: '1',
          name: 'LinkedIn Profile Monitoring',
          description: 'Track engagement on target prospects profiles and posts. Get notified when they are active.',
          category: 'automation',
          status: 'building',
          priority: 'high',
          availability: 'founding_members',
          progress_percentage: 75,
          estimated_completion: '2024-06-30',
          upvotes: 24,
          submitted_by: '1',
          submitted_by_name: 'Demo User',
          submitted_by_email: 'demo@example.com',
          comment_count: 3,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T15:30:00Z'
        },
        {
          id: '2',
          name: 'AI Lead Scoring',
          description: 'Advanced AI algorithm that scores prospects 0-100 based on your ICP criteria.',
          category: 'analytics',
          status: 'building',
          priority: 'high',
          availability: 'founding_members',
          progress_percentage: 60,
          estimated_completion: '2024-07-15',
          upvotes: 18,
          submitted_by: '2',
          submitted_by_name: 'Sarah Chen',
          submitted_by_email: 'sarah@example.com',
          comment_count: 5,
          created_at: '2024-01-20T14:30:00Z',
          updated_at: '2024-01-25T09:15:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (featureId: string) => {
    if (!currentUser) return;

    const hasVoted = userVotes.some(vote => vote.feature_id === featureId);

    try {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('feature_votes')
          .delete()
          .eq('feature_id', featureId)
          .eq('user_id', currentUser.id);

        if (error) throw error;

        setUserVotes(prev => prev.filter(vote => vote.feature_id !== featureId));
        setFeatures(prev => prev.map(feature => 
          feature.id === featureId 
            ? { ...feature, upvotes: feature.upvotes - 1 }
            : feature
        ));
      } else {
        // Add vote
        const { error } = await supabase
          .from('feature_votes')
          .insert({ feature_id: featureId, user_id: currentUser.id });

        if (error) throw error;

        setUserVotes(prev => [...prev, { feature_id: featureId, user_id: currentUser.id }]);
        setFeatures(prev => prev.map(feature => 
          feature.id === featureId 
            ? { ...feature, upvotes: feature.upvotes + 1 }
            : feature
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  const handleSubmitRequest = async () => {
    if (!currentUser) {
      alert('Please sign in to submit a feature request.');
      return;
    }

    if (!newRequest.title || !newRequest.description || !newRequest.category || !newRequest.priority) {
      alert('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', currentUser.id)
        .single();

      if (userError) throw userError;

      const { error } = await supabase
        .from('features')
        .insert({
          name: newRequest.title,
          description: newRequest.description,
          category: newRequest.category,
          priority: newRequest.priority,
          status: 'requested',
          submitted_by: userData.id
        });

      if (error) throw error;

      // Reset form and close dialog
      setNewRequest({ title: '', description: '', category: '', priority: '' });
      setDialogOpen(false);
      
      // Refresh features list
      fetchFeatures();
      
      alert('Feature request submitted successfully!');
    } catch (error) {
      console.error('Error submitting feature request:', error);
      alert('Failed to submit feature request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'building': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'requested': return 'bg-gray-100 text-gray-800';
      case 'testing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'building': return <Wrench className="w-4 h-4" />;
      case 'under_review': return <AlertCircle className="w-4 h-4" />;
      case 'requested': return <MessageSquare className="w-4 h-4" />;
      case 'testing': return <TestTube className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'founding_members': return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Founding Members</Badge>;
      case 'beta_users': return <Badge className="bg-blue-100 text-blue-800 text-xs">Beta Users</Badge>;
      case 'pro_users': return <Badge className="bg-purple-100 text-purple-800 text-xs">Pro Users</Badge>;
      case 'all_users': return <Badge className="bg-green-100 text-green-800 text-xs">All Users</Badge>;
      default: return null;
    }
  };

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || feature.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const statusCounts = features.reduce((acc, feature) => {
    acc[feature.status] = (acc[feature.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading feature requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Feature Requests</h1>
            <p className="text-xl text-muted-foreground">
              See what we're building and request new features
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Request Feature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit a Feature Request</DialogTitle>
                <DialogDescription>
                  Help us prioritize what to build next by submitting your feature ideas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div>
                  <Label htmlFor="title">Feature Title</Label>
                  <Input
                    id="title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    placeholder="Brief, descriptive title for your feature request"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    placeholder="Detailed description of the feature, including use cases and benefits"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newRequest.category} onValueChange={(value) => setNewRequest({ ...newRequest, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automation">Automation</SelectItem>
                        <SelectItem value="integrations">Integrations</SelectItem>
                        <SelectItem value="search">Search</SelectItem>
                        <SelectItem value="templates">Templates</SelectItem>
                        <SelectItem value="platform">Platform</SelectItem>
                        <SelectItem value="collaboration">Collaboration</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newRequest.priority} onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search feature requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
              <SelectItem value="integrations">Integrations</SelectItem>
              <SelectItem value="search">Search</SelectItem>
              <SelectItem value="templates">Templates</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="collaboration">Collaboration</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="building">Building</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.building || 0}</div>
            <div className="text-sm text-muted-foreground">Building</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.under_review || 0}</div>
            <div className="text-sm text-muted-foreground">Under Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-600">{statusCounts.requested || 0}</div>
            <div className="text-sm text-muted-foreground">Requested</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.testing || 0}</div>
            <div className="text-sm text-muted-foreground">Testing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed || 0}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Requests List */}
      <div className="space-y-6">
        {filteredFeatures.map((feature) => {
          const hasVoted = userVotes.some(vote => vote.feature_id === feature.id);
          
          return (
            <Card key={feature.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(feature.status)}
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                      {getAvailabilityBadge(feature.availability)}
                    </div>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(feature.status)}>
                      {feature.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    <Badge className={getPriorityColor(feature.priority)}>
                      {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                {feature.progress_percentage > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">{feature.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${feature.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {feature.submitted_by_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {feature.submitted_by_name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(feature.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {feature.category.charAt(0).toUpperCase() + feature.category.slice(1)}
                    </div>
                    {feature.estimated_completion && (
                      <div className="font-medium text-primary">
                        ETA: {new Date(feature.estimated_completion).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant={hasVoted ? "default" : "ghost"} 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleVote(feature.id)}
                      disabled={!currentUser}
                    >
                      <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                      {feature.upvotes}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {feature.comment_count}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFeatures.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No feature requests found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters, or submit a new feature request.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeatureRequests; 