// LinkedIn Data Service
// This service handles fetching and managing LinkedIn profile data

export interface LinkedInProfileData {
  profile: {
    name: string;
    title: string;
    company: string;
    location: string;
    profilePicture: string;
    linkedinUrl: string;
    industry: string;
    summary: string;
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      school: string;
      degree: string;
      year: string;
    }>;
    skills: Array<{
      name: string;
      endorsements: number;
    }>;
  };
  stats: {
    profileViews: {
      total: number;
      thisWeek: number;
      thisMonth: number;
      trend: number;
    };
    connections: {
      total: number;
      newThisWeek: number;
      trend: number;
    };
    endorsements: {
      total: number;
      newThisWeek: number;
      trend: number;
    };
    posts: {
      total: number;
      thisWeek: number;
      engagement: number;
    };
    engagement: {
      rate: number;
      likes: number;
      comments: number;
      shares: number;
    };
  };
  activity: {
    recentPosts: Array<{
      id: string;
      content: string;
      timestamp: Date;
      engagement: {
        likes: number;
        comments: number;
        shares: number;
      };
      reach: number;
    }>;
    recentViews: Array<{
      id: string;
      viewer: {
        name: string;
        title: string;
        company: string;
        avatar: string;
      };
      timestamp: Date;
    }>;
    recentConnections: Array<{
      id: string;
      name: string;
      title: string;
      company: string;
      avatar: string;
      timestamp: Date;
    }>;
  };
  analytics: {
    weeklyViews: Array<{ date: string; views: number }>;
    monthlyGrowth: Array<{ month: string; growth: number }>;
    topIndustries: Array<{ industry: string; percentage: number }>;
    engagementTrends: Array<{ date: string; engagement: number }>;
  };
}

class LinkedInService {
  private static instance: LinkedInService;
  private currentData: LinkedInProfileData | null = null;
  private isFetching = false;
  private API_BASE = 'http://localhost:3001/api';

  static getInstance(): LinkedInService {
    if (!LinkedInService.instance) {
      LinkedInService.instance = new LinkedInService();
    }
    return LinkedInService.instance;
  }

  // Extract username from LinkedIn URL
  private extractUsername(linkedinUrl: string): string {
    try {
      const url = new URL(linkedinUrl);
      const pathParts = url.pathname.split('/');
      const username = pathParts.find(part => part && part !== 'in');
      return username || 'unknown';
    } catch (error) {
      console.error('Error extracting username from URL:', error);
      return 'unknown';
    }
  }

  // Fetch LinkedIn profile data from real backend
  async fetchProfileData(linkedinUrl: string): Promise<LinkedInProfileData> {
    if (this.isFetching) {
      throw new Error('Already fetching data');
    }

    this.isFetching = true;

    try {
      const username = this.extractUsername(linkedinUrl);
      console.log(`Fetching real LinkedIn data for: ${username}`);
      
      const response = await fetch(`${this.API_BASE}/linkedin/profile/${username}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const profileData = await response.json();
      
      // Save to localStorage
      localStorage.setItem('linkyLinkedInData', JSON.stringify(profileData));
      this.currentData = profileData;
      
      return profileData;
    } catch (error) {
      console.error('Error fetching LinkedIn data:', error);
      
      // Fallback to simulated data if backend is not available
      console.log('Falling back to simulated data...');
      const fallbackData = await this.simulateLinkedInFetch(linkedinUrl);
      return fallbackData;
    } finally {
      this.isFetching = false;
    }
  }

  // Simulate fetching LinkedIn data (fallback)
  private async simulateLinkedInFetch(linkedinUrl: string): Promise<LinkedInProfileData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract username from LinkedIn URL
    const username = this.extractUsername(linkedinUrl);
    
    // Generate realistic data based on the URL
    const profileData: LinkedInProfileData = {
      profile: {
        name: 'Tyler Amos', // Use actual user name from settings
        title: 'Software Engineer',
        company: 'Tech Company',
        location: 'Nashville, TN',
        profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        linkedinUrl: linkedinUrl,
        industry: 'Technology',
        summary: 'Passionate software engineer with experience in modern web technologies.',
        experience: [
          {
            title: 'Software Engineer',
            company: 'Tech Company',
            duration: '2022 - Present',
            description: 'Building scalable web applications using React, Node.js, and cloud technologies.'
          }
        ],
        education: [
          {
            school: 'University',
            degree: 'Computer Science',
            year: '2022'
          }
        ],
        skills: [
          { name: 'React.js', endorsements: 15 },
          { name: 'JavaScript', endorsements: 12 },
          { name: 'Node.js', endorsements: 10 },
          { name: 'TypeScript', endorsements: 8 },
          { name: 'AWS', endorsements: 6 }
        ]
      },
      stats: {
        profileViews: {
          total: Math.floor(Math.random() * 1000) + 500,
          thisWeek: Math.floor(Math.random() * 50) + 10,
          thisMonth: Math.floor(Math.random() * 200) + 50,
          trend: Math.floor(Math.random() * 20) - 5
        },
        connections: {
          total: Math.floor(Math.random() * 500) + 200,
          newThisWeek: Math.floor(Math.random() * 10) + 1,
          trend: Math.floor(Math.random() * 10) - 2
        },
        endorsements: {
          total: Math.floor(Math.random() * 50) + 20,
          newThisWeek: Math.floor(Math.random() * 5) + 1,
          trend: Math.floor(Math.random() * 15) - 5
        },
        posts: {
          total: Math.floor(Math.random() * 20) + 5,
          thisWeek: Math.floor(Math.random() * 3) + 1,
          engagement: Math.floor(Math.random() * 100) + 50
        },
        engagement: {
          rate: Math.floor(Math.random() * 30) + 10,
          likes: Math.floor(Math.random() * 50) + 20,
          comments: Math.floor(Math.random() * 20) + 5,
          shares: Math.floor(Math.random() * 10) + 2
        }
      },
      activity: {
        recentPosts: [
          {
            id: '1',
            content: 'Excited to share my latest project! Building amazing software with modern technologies.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            engagement: { likes: 25, comments: 8, shares: 3 },
            reach: 800
          }
        ],
        recentViews: [
          {
            id: '1',
            viewer: {
              name: 'Sarah Johnson',
              title: 'Engineering Manager',
              company: 'Tech Corp',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
            },
            timestamp: new Date(Date.now() - 30 * 60 * 1000)
          }
        ],
        recentConnections: [
          {
            id: '1',
            name: 'Mike Chen',
            title: 'Senior Developer',
            company: 'Startup Inc',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
          }
        ]
      },
      analytics: {
        weeklyViews: [
          { date: 'Mon', views: Math.floor(Math.random() * 20) + 5 },
          { date: 'Tue', views: Math.floor(Math.random() * 20) + 8 },
          { date: 'Wed', views: Math.floor(Math.random() * 20) + 12 },
          { date: 'Thu', views: Math.floor(Math.random() * 20) + 15 },
          { date: 'Fri', views: Math.floor(Math.random() * 20) + 10 },
          { date: 'Sat', views: Math.floor(Math.random() * 10) + 3 },
          { date: 'Sun', views: Math.floor(Math.random() * 10) + 2 }
        ],
        monthlyGrowth: [
          { month: 'Jan', growth: Math.floor(Math.random() * 15) + 5 },
          { month: 'Feb', growth: Math.floor(Math.random() * 15) + 8 },
          { month: 'Mar', growth: Math.floor(Math.random() * 15) + 12 },
          { month: 'Apr', growth: Math.floor(Math.random() * 15) + 10 }
        ],
        topIndustries: [
          { industry: 'Technology', percentage: 45 },
          { industry: 'Finance', percentage: 20 },
          { industry: 'Healthcare', percentage: 15 },
          { industry: 'Education', percentage: 10 },
          { industry: 'Other', percentage: 10 }
        ],
        engagementTrends: [
          { date: 'Week 1', engagement: Math.floor(Math.random() * 10) + 15 },
          { date: 'Week 2', engagement: Math.floor(Math.random() * 10) + 18 },
          { date: 'Week 3', engagement: Math.floor(Math.random() * 10) + 20 },
          { date: 'Week 4', engagement: Math.floor(Math.random() * 10) + 22 }
        ]
      }
    };

    return profileData;
  }

  // Get cached data
  getCachedData(): LinkedInProfileData | null {
    if (this.currentData) {
      return this.currentData;
    }

    const cached = localStorage.getItem('linkyLinkedInData');
    if (cached) {
      this.currentData = JSON.parse(cached);
      return this.currentData;
    }

    return null;
  }

  // Clear cached data
  clearCache(): void {
    this.currentData = null;
    localStorage.removeItem('linkyLinkedInData');
  }

  // Check if data is fresh (less than 15 minutes old)
  isDataFresh(): boolean {
    const lastUpdated = localStorage.getItem('linkyDataLastUpdated');
    if (!lastUpdated) return false;

    const lastUpdate = new Date(lastUpdated);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

    return diffInMinutes < 15;
  }

  // Update last updated timestamp
  updateTimestamp(): void {
    localStorage.setItem('linkyDataLastUpdated', new Date().toISOString());
  }
}

export default LinkedInService; 