import { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  Brain, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Rocket, 
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface User {
  first_name?: string;
  last_name?: string;
  email?: string;
  founding_member?: boolean;
  subscription_plan?: string;
  created_at?: string;
}

const DashboardWelcome = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        // Get current auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          console.log('Auth user found in welcome:', authUser.email);
          
          // Try method 1: Fetch user details using auth_user_id
          let { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', authUser.id)
            .single();

          if (error || !userData) {
            console.log('Welcome: Method 1 failed, trying method 2: fetch by email');
            
            // Try method 2: Fetch user details by email (fallback for unlinked accounts)
            const { data: emailUserData, error: emailError } = await supabase
              .from('users')
              .select('*')
              .eq('email', authUser.email)
              .single();

            if (emailError) {
              console.error('Welcome: Method 2 failed - Error fetching user data by email:', emailError);
              
              // Method 3: Use auth user data as fallback
              console.log('Welcome: Using auth user data as fallback');
              setUser({
                first_name: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User',
                last_name: authUser.user_metadata?.last_name || '',
                email: authUser.email || '',
                founding_member: true,
                subscription_plan: 'founding_member',
                created_at: authUser.created_at || new Date().toISOString()
              });
            } else if (emailUserData) {
              console.log('Welcome: Found user by email:', emailUserData.email);
              
              // Check if auth_user_id needs to be linked
              if (!emailUserData.auth_user_id || emailUserData.auth_user_id !== authUser.id) {
                console.log('Welcome: Attempting to link auth_user_id...');
                
                // Try to update the auth_user_id (might fail due to permissions)
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ auth_user_id: authUser.id })
                  .eq('id', emailUserData.id);
                
                if (updateError) {
                  console.log('Welcome: Could not auto-link auth_user_id:', updateError.message);
                } else {
                  console.log('Welcome: Successfully linked auth_user_id');
                }
              }
              
              setUser(emailUserData);
            }
          } else {
            console.log('Welcome: Method 1 success - Found user by auth_user_id');
            setUser(userData);
          }
        } else {
          console.log('Welcome: No authenticated user found');
          // No auth user, show demo data
          setUser({
            first_name: 'Demo',
            last_name: 'User',
            email: 'demo@example.com',
            founding_member: true,
            subscription_plan: 'founding_member',
            created_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Welcome: Error fetching user:', error);
        
        // Final fallback
        setUser({
          first_name: 'User',
          last_name: '',
          email: '',
          founding_member: true,
          subscription_plan: 'founding_member',
          created_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const upcomingFeatures = [
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: "LinkedIn Profile Monitoring",
      description: "Track engagement on your target prospects' profiles and posts. Get notified when they're active or post new content.",
      timeline: "Coming Soon"
    },
    {
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      title: "AI Lead Scoring",
      description: "Advanced AI algorithm that scores prospects 0-100 based on your ICP (industry, company size, location, role).",
      timeline: "Coming Soon"
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-green-600" />,
      title: "Personalized Comment Generation",
      description: "Generate 5 authentic, personalized comments in your voice for any LinkedIn post to boost engagement.",
      timeline: "Q3 2024"
    },
    {
      icon: <Users className="w-6 h-6 text-orange-600" />,
      title: "Dream Lead Tracker",
      description: "Monitor your top prospects and get instant alerts when they engage, post updates, or show buying signals.",
      timeline: "Q3 2024"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-red-600" />,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into your LinkedIn outreach performance, engagement rates, and ROI tracking.",
      timeline: "Q4 2024"
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: "Automation Engine",
      description: "Smart automation for connection requests, follow-ups, and engagement based on prospect behavior.",
      timeline: "Q4 2024"
    }
  ];

  const getUserName = () => {
    if (!user) return 'User';
    const firstName = user.first_name || 'User';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Crown className="w-12 h-12 text-yellow-600" />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-4">
          Welcome to Linky, {getUserName()}!
        </h1>
        <p className="text-2xl text-muted-foreground mb-8">
          You're a founding member 🎉
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-semibold text-blue-900">We're Building Something Amazing</h2>
          </div>
          <p className="text-lg text-blue-800 mb-6">
            We are working towards getting our first features launched. Please keep an eye on your inbox - expect to use Linky soon!
          </p>
                     <div className="bg-white/60 rounded-lg p-4">
             <p className="text-blue-700 font-medium">
               As a founding member, you paid just $50 for your first 3 months. After that, you'll automatically upgrade to our Prospector plan for $75/month.
             </p>
           </div>
        </div>
      </div>

      {/* Features Coming Soon */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Target className="w-6 h-6 text-primary" />
            What's Coming to Linky
          </CardTitle>
          <CardDescription className="text-lg">
            Here are the powerful features we're building for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingFeatures.map((feature, index) => (
              <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {feature.timeline}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardWelcome; 