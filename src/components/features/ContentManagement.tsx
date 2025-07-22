import { useState } from 'react';
import { 
  Rss, 
  Search, 
  Plus, 
  Filter, 
  BookOpen, 
  Edit3, 
  Share2, 
  Clock,
  TrendingUp,
  Users,
  Globe,
  Star,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Feed {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  subscribers: number;
  lastUpdated: string;
  isSubscribed: boolean;
}

interface FeedItem {
  id: string;
  title: string;
  url: string;
  content: string;
  publishedAt: string;
  feedTitle: string;
  imageUrl?: string;
  read: boolean;
}

interface Draft {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'carousel' | 'poll';
  status: 'draft' | 'ready' | 'scheduled';
  createdAt: string;
  scheduledFor?: string;
}

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data for demonstration
  const categories = [
    { id: 'all', name: 'All Categories', icon: Globe },
    { id: 'tech', name: 'Technology', icon: TrendingUp },
    { id: 'business', name: 'Business', icon: Users },
    { id: 'marketing', name: 'Marketing', icon: Share2 },
    { id: 'productivity', name: 'Productivity', icon: Clock },
  ];

  const mockFeeds: Feed[] = [
    {
      id: '1',
      title: 'TechCrunch',
      url: 'https://techcrunch.com/feed/',
      description: 'Latest technology news and startup information',
      category: 'tech',
      subscribers: 1250000,
      lastUpdated: '2 hours ago',
      isSubscribed: false,
    },
    {
      id: '2',
      title: 'Harvard Business Review',
      url: 'https://hbr.org/feed',
      description: 'Management ideas and insights for business leaders',
      category: 'business',
      subscribers: 890000,
      lastUpdated: '1 hour ago',
      isSubscribed: true,
    },
    {
      id: '3',
      title: 'Marketing Week',
      url: 'https://www.marketingweek.com/feed/',
      description: 'Marketing news, analysis and insights',
      category: 'marketing',
      subscribers: 450000,
      lastUpdated: '3 hours ago',
      isSubscribed: false,
    },
  ];

  const mockFeedItems: FeedItem[] = [
    {
      id: '1',
      title: 'The Future of AI in Business: 2024 Trends',
      url: 'https://example.com/ai-trends-2024',
      content: 'Artificial Intelligence continues to revolutionize how businesses operate...',
      publishedAt: '2 hours ago',
      feedTitle: 'TechCrunch',
      imageUrl: 'https://via.placeholder.com/300x200',
      read: false,
    },
    {
      id: '2',
      title: 'Building Effective Remote Teams',
      url: 'https://example.com/remote-teams',
      content: 'As remote work becomes the new normal, leaders must adapt...',
      publishedAt: '4 hours ago',
      feedTitle: 'Harvard Business Review',
      imageUrl: 'https://via.placeholder.com/300x200',
      read: true,
    },
  ];

  const mockDrafts: Draft[] = [
    {
      id: '1',
      title: 'My thoughts on AI trends',
      content: 'After reading the latest TechCrunch article, I believe...',
      type: 'text',
      status: 'draft',
      createdAt: '1 hour ago',
    },
    {
      id: '2',
      title: 'Remote work insights',
      content: 'Based on the HBR article, here are my key takeaways...',
      type: 'carousel',
      status: 'ready',
      createdAt: '3 hours ago',
    },
  ];

  const filteredFeeds = mockFeeds.filter(feed => {
    const matchesSearch = feed.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feed.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feed.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-2">
            Discover RSS feeds, review content, and create engaging posts
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Feeds
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Rss className="w-4 h-4" />
            Discover Feeds
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Content Review
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            My Drafts
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Scheduled
          </TabsTrigger>
        </TabsList>

        {/* Discover Feeds Tab */}
        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search feeds by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Featured Feeds */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Feeds</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFeeds.map((feed) => (
                <Card key={feed.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{feed.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {feed.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant={feed.isSubscribed ? "outline" : "default"}
                        size="sm"
                        className="ml-2"
                      >
                        {feed.isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {feed.subscribers.toLocaleString()}
                        </span>
                        <span>{feed.lastUpdated}</span>
                      </div>
                      <Badge variant="secondary">{feed.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(1).map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.id} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">{category.name}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Content Review Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Latest Content</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                Mark All Read
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {mockFeedItems.map((item) => (
              <Card key={item.id} className={`hover:shadow-md transition-shadow ${!item.read ? 'border-l-4 border-l-primary' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {item.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Rss className="w-4 h-4" />
                              {item.feedTitle}
                            </span>
                            <span>{item.publishedAt}</span>
                            {!item.read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button size="sm">
                            <Edit3 className="w-4 h-4 mr-2" />
                            Create Draft
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Drafts Tab */}
        <TabsContent value="drafts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">My Drafts</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Draft
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDrafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{draft.title}</CardTitle>
                    <Badge 
                      variant={draft.status === 'ready' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {draft.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {draft.content.substring(0, 100)}...
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{draft.createdAt}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Posts</h3>
            <p className="text-gray-600 mb-4">
              Posts you schedule will appear here
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Post
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagement; 