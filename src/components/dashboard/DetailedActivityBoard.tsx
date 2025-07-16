import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LinkedInService, { LinkedInProfileData } from '@/services/linkedinService';
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
  Zap,
  MapPin,
  Building,
  Award,
  Star,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';



const DetailedActivityBoard: React.FC = () => {
  const [profileData, setProfileData] = useState<LinkedInProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const linkedinService = LinkedInService.getInstance();

  // Load data on component mount
  useEffect(() => {
    loadProfileData();
    
    // Listen for profile updates from settings
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail?.linkedinUrl) {
        loadProfileData(event.detail.linkedinUrl);
      }
    };
    
    window.addEventListener('linkedinProfileUpdated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('linkedinProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  const loadProfileData = async (linkedinUrl?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let data: LinkedInProfileData;
      
      if (linkedinUrl) {
        // Fetch fresh data for the new URL
        data = await linkedinService.fetchProfileData(linkedinUrl);
        linkedinService.updateTimestamp();
      } else {
        // Try to get cached data first
        data = linkedinService.getCachedData();
        
        if (!data) {
          // No cached data, check if we have a LinkedIn URL in settings
          const savedProfile = localStorage.getItem('linkyUserProfile');
          if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            if (profile.linkedinUrl) {
              data = await linkedinService.fetchProfileData(profile.linkedinUrl);
              linkedinService.updateTimestamp();
            }
          }
        }
      }
      
      if (data) {
        setProfileData(data);
      } else {
        setError('No LinkedIn profile data available. Please configure your profile in Settings.');
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load LinkedIn profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 font-medium">Error Loading Data</p>
            <p className="text-red-500 text-sm mt-2">{error}</p>
            <Button 
              onClick={() => loadProfileData()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-600 font-medium">No Profile Data</p>
            <p className="text-blue-500 text-sm mt-2">
              Please configure your LinkedIn profile in Settings to view your activity data.
            </p>
            <Link to="/dashboard/settings">
              <Button className="mt-4" variant="outline">
                Go to Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">LinkedIn Activity Board</h1>
          <p className="text-muted-foreground">Detailed analytics and insights from your LinkedIn profile</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profileData.profile.profilePicture} />
              <AvatarFallback>{profileData.profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-semibold">{profileData.profile.name}</div>
              <div className="text-sm text-muted-foreground">{profileData.profile.title} at {profileData.profile.company}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">{profileData.stats.profileViews.total}</div>
                <div className="text-sm text-muted-foreground">Profile Views</div>
                <div className="flex items-center space-x-1 text-xs">
                  {getTrendIcon(profileData.stats.profileViews.trend)}
                  <span className={getTrendColor(profileData.stats.profileViews.trend)}>
                    {profileData.stats.profileViews.trend > 0 ? '+' : ''}{profileData.stats.profileViews.trend}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">{profileData.stats.connections.total}</div>
                <div className="text-sm text-muted-foreground">Connections</div>
                <div className="flex items-center space-x-1 text-xs">
                  {getTrendIcon(profileData.stats.connections.trend)}
                  <span className={getTrendColor(profileData.stats.connections.trend)}>
                    {profileData.stats.connections.trend > 0 ? '+' : ''}{profileData.stats.connections.trend}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold">{profileData.stats.endorsements.total}</div>
                <div className="text-sm text-muted-foreground">Endorsements</div>
                <div className="flex items-center space-x-1 text-xs">
                  {getTrendIcon(profileData.stats.endorsements.trend)}
                  <span className={getTrendColor(profileData.stats.endorsements.trend)}>
                    {profileData.stats.endorsements.trend > 0 ? '+' : ''}{profileData.stats.endorsements.trend}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold">{profileData.stats.posts.total}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
                <div className="text-xs text-muted-foreground">
                  {profileData.stats.posts.engagement} engagements
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Views Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Weekly Profile Views</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileData.analytics.weeklyViews.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.date}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(day.views / 25) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{day.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Engagement Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{profileData.stats.engagement.rate}%</div>
                    <div className="text-sm text-muted-foreground">Overall Engagement Rate</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{profileData.stats.engagement.likes}</div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{profileData.stats.engagement.comments}</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{profileData.stats.engagement.shares}</div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Recent Posts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileData.activity.recentPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <p className="text-sm mb-3">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-4">
                          <span>❤️ {post.engagement.likes}</span>
                          <span>💬 {post.engagement.comments}</span>
                          <span>📤 {post.engagement.shares}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Profile Views */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Recent Profile Views</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileData.activity.recentViews.map((view) => (
                    <div key={view.id} className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={view.viewer.avatar} />
                        <AvatarFallback>{view.viewer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{view.viewer.name}</div>
                        <div className="text-xs text-muted-foreground">{view.viewer.title} at {view.viewer.company}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(view.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="w-5 h-5" />
                  <span>Monthly Growth</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileData.analytics.monthlyGrowth.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(month.growth * 5, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12">{month.growth}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Industries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Top Industries</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileData.analytics.topIndustries.map((industry) => (
                    <div key={industry.industry} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{industry.industry}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${industry.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12">{industry.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills & Endorsements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Top Skills</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileData.profile.skills.map((skill) => (
                    <div key={skill.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(skill.endorsements / 50) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{skill.endorsements}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Experience</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileData.profile.experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4">
                      <div className="font-medium">{exp.title}</div>
                      <div className="text-sm text-muted-foreground">{exp.company}</div>
                      <div className="text-xs text-muted-foreground">{exp.duration}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetailedActivityBoard; 