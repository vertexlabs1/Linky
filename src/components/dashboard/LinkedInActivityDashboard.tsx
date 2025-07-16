import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  Activity,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

interface LinkedInActivity {
  profile: {
    name: string;
    title: string;
    company: string;
    location: string;
    profilePicture: string;
    linkedinUrl: string;
  };
  stats: {
    profileViews: number;
    connections: number;
    endorsements: number;
    posts: number;
    engagement: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'post' | 'connection' | 'endorsement' | 'view';
    content: string;
    timestamp: Date;
    engagement?: number;
  }>;
  trends: {
    profileViews: { current: number; previous: number; change: number };
    connections: { current: number; previous: number; change: number };
    engagement: { current: number; previous: number; change: number };
  };
}

const LinkedInActivityDashboard: React.FC = () => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activity, setActivity] = useState<LinkedInActivity | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mock data for demonstration
  const mockActivity: LinkedInActivity = {
    profile: {
      name: 'John Smith',
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      linkedinUrl: 'https://linkedin.com/in/johnsmith'
    },
    stats: {
      profileViews: 1247,
      connections: 567,
      endorsements: 89,
      posts: 23,
      engagement: 156
    },
    recentActivity: [
      {
        id: '1',
        type: 'post',
        content: 'Excited to share that I\'ve joined TechCorp as Senior Software Engineer! Looking forward to building amazing products with this incredible team.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        engagement: 45
      },
      {
        id: '2',
        type: 'connection',
        content: 'Connected with Sarah Johnson',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: '3',
        type: 'endorsement',
        content: 'Received endorsement for React.js from Mike Chen',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        id: '4',
        type: 'view',
        content: 'Profile viewed by 12 people this week',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      }
    ],
    trends: {
      profileViews: { current: 1247, previous: 1100, change: 13.4 },
      connections: { current: 567, previous: 550, change: 3.1 },
      engagement: { current: 156, previous: 140, change: 11.4 }
    }
  };

  useEffect(() => {
    // Simulate real-time updates
    if (isMonitoring) {
      setActivity(mockActivity);
      setLastUpdated(new Date());
      
      const interval = setInterval(() => {
        // Simulate data updates every 15 minutes
        setLastUpdated(new Date());
      }, 15 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const startMonitoring = () => {
    if (linkedinUrl) {
      setIsMonitoring(true);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setActivity(null);
    setLastUpdated(null);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageSquare className="w-4 h-4" />;
      case 'connection': return <Users className="w-4 h-4" />;
      case 'endorsement': return <ThumbsUp className="w-4 h-4" />;
      case 'view': return <Eye className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post': return 'bg-blue-100 text-blue-800';
      case 'connection': return 'bg-green-100 text-green-800';
      case 'endorsement': return 'bg-purple-100 text-purple-800';
      case 'view': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">LinkedIn Activity Dashboard</h1>
          <p className="text-muted-foreground">Monitor your LinkedIn profile activity in real-time</p>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <Badge variant="secondary" className="text-xs">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            disabled={!linkedinUrl && !isMonitoring}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* LinkedIn URL Input */}
      {!isMonitoring && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Add LinkedIn Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
                <Input
                  id="linkedin-url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your public LinkedIn profile URL to start monitoring your activity
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Overview */}
      {activity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={activity.profile.profilePicture} />
                <AvatarFallback>{activity.profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{activity.profile.name}</div>
                <div className="text-sm text-muted-foreground">{activity.profile.title} at {activity.profile.company}</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">{activity.stats.profileViews}</div>
                  <div className="text-sm text-muted-foreground">Profile Views</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">{activity.stats.connections}</div>
                  <div className="text-sm text-muted-foreground">Connections</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ThumbsUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold">{activity.stats.endorsements}</div>
                  <div className="text-sm text-muted-foreground">Endorsements</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold">{activity.stats.posts}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends */}
      {activity && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profile Views Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {activity.trends.profileViews.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  activity.trends.profileViews.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {activity.trends.profileViews.change > 0 ? '+' : ''}{activity.trends.profileViews.change}%
                </span>
              </div>
              <Progress value={Math.abs(activity.trends.profileViews.change)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Connections Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {activity.trends.connections.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  activity.trends.connections.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {activity.trends.connections.change > 0 ? '+' : ''}{activity.trends.connections.change}%
                </span>
              </div>
              <Progress value={Math.abs(activity.trends.connections.change)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {activity.trends.engagement.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  activity.trends.engagement.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {activity.trends.engagement.change > 0 ? '+' : ''}{activity.trends.engagement.change}%
                </span>
              </div>
              <Progress value={Math.abs(activity.trends.engagement.change)} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity Feed */}
      {activity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.recentActivity.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${getActivityColor(item.type)}`}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{item.content}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                    {item.engagement && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.engagement} engagements
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Status */}
      {isMonitoring && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">
                Monitoring active - Updates every 15 minutes
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LinkedInActivityDashboard; 