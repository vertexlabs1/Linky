import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  Crown, 
  Settings, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Edit,
  Save,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';

interface UserData {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  founding_member?: boolean;
  subscription_plan?: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  created_at?: string;
}

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '', 
    email: '',
    phone: '',
    company: '',
    jobTitle: ''
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    featureAnnouncements: true,
    billingAlerts: true,
    weeklyDigest: false
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        // Get current auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Fetch user details from users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', authUser.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            // Fallback to auth user data
            const fallbackUser = {
              first_name: authUser.user_metadata?.first_name || '',
              last_name: authUser.user_metadata?.last_name || '',
              email: authUser.email || '',
              phone: '',
              founding_member: false,
              subscription_plan: 'free',
              subscription_status: 'inactive',
              created_at: authUser.created_at
            };
            setUser(fallbackUser);
            setUserInfo({
              firstName: fallbackUser.first_name || '',
              lastName: fallbackUser.last_name || '',
              email: fallbackUser.email || '',
              phone: fallbackUser.phone || '',
              company: '',
              jobTitle: ''
            });
          } else {
            setUser(userData);
            setUserInfo({
              firstName: userData.first_name || '',
              lastName: userData.last_name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              company: '',
              jobTitle: ''
            });
          }
        } else {
          // No auth user, show demo data
          const demoUser = {
            first_name: 'Demo',
            last_name: 'User',
            email: 'demo@example.com',
            phone: '',
            founding_member: true,
            subscription_plan: 'founding_member',
            subscription_status: 'active',
            created_at: new Date().toISOString()
          };
          setUser(demoUser);
          setUserInfo({
            firstName: demoUser.first_name || '',
            lastName: demoUser.last_name || '',
            email: demoUser.email || '',
            phone: demoUser.phone || '',
            company: '',
            jobTitle: ''
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phone,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      } else {
        setUser(prev => prev ? {
          ...prev,
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phone,
        } : null);
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setUserInfo({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: '',
        jobTitle: ''
      });
    }
    setIsEditing(false);
  };

  const handleManageBilling = () => {
    // Here you would redirect to Stripe Customer Portal
    if (user?.stripe_customer_id) {
      console.log('Opening Stripe Customer Portal for customer:', user.stripe_customer_id);
      // Implement Stripe Customer Portal redirect
    } else {
      console.log('No Stripe customer ID found');
    }
  };

  const getSubscriptionDetails = () => {
    if (user?.founding_member) {
      return {
        plan: 'Founding Member',
        status: 'Active',
        billingCycle: 'Lifetime',
        nextBilling: 'N/A - Lifetime Access',
        price: '$25 (One-time)',
        features: [
          'Early access to all features',
          'Lifetime 62% discount',
          'Direct product feedback',
          'VIP community access',
          'Priority customer support'
        ]
      };
    }

    return {
      plan: user?.subscription_plan?.charAt(0).toUpperCase() + user?.subscription_plan?.slice(1) || 'Free',
      status: user?.subscription_status || 'Inactive',
      billingCycle: 'Monthly',
      nextBilling: 'Not applicable',
      price: '$0',
      features: [
        'Basic access to features',
        'Community support',
        'Standard updates'
      ]
    };
  };

  const subscription = getSubscriptionDetails();

  const billingHistory = user?.founding_member ? [
    {
      date: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '2024-01-15',
      description: 'Founding Member - Lifetime Access',
      amount: '$25.00',
      status: 'Paid'
    }
  ] : [];

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Account Settings</h1>
        <p className="text-xl text-muted-foreground">
          Manage your profile, billing, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and contact information
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {(userInfo.firstName[0] || 'U')}{(userInfo.lastName[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {userInfo.firstName} {userInfo.lastName} 
                        {(!userInfo.firstName && !userInfo.lastName) && 'User'}
                      </h3>
                      <p className="text-muted-foreground">{userInfo.jobTitle || 'No title set'} {userInfo.company && `at ${userInfo.company}`}</p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        Change Photo
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={userInfo.firstName}
                        onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={userInfo.lastName}
                        onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={userInfo.company}
                        onChange={(e) => setUserInfo({ ...userInfo, company: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={userInfo.jobTitle}
                        onChange={(e) => setUserInfo({ ...userInfo, jobTitle: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your job title"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Status */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {user?.founding_member ? (
                      <Crown className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge className={user?.founding_member ? "bg-primary text-primary-foreground mb-2" : "bg-gray-100 text-gray-800 mb-2"}>
                      {subscription.plan}
                    </Badge>
                    <p className="text-2xl font-bold text-foreground">{subscription.price}</p>
                    <p className="text-sm text-muted-foreground">{subscription.billingCycle}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-foreground">Status</p>
                    <p className={`text-sm ${subscription.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>
                      {subscription.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">Next Billing</p>
                    <p className="text-sm text-muted-foreground">{subscription.nextBilling}</p>
                  </div>

                  {user?.stripe_customer_id && (
                    <Button variant="outline" className="w-full" onClick={handleManageBilling}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>
                    {user?.founding_member ? 'Your Benefits' : 'Available Benefits'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        {user?.founding_member ? (
                          <Crown className="w-3 h-3 text-yellow-600" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gray-300" />
                        )}
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {!user?.founding_member && (
                    <Button className="w-full mt-4" size="sm">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Founding Member
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{subscription.plan}</p>
                    <p className="text-sm text-muted-foreground">{subscription.price}</p>
                  </div>
                  <Badge className={subscription.status === 'Active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {subscription.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className={`font-medium ${subscription.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>
                      {subscription.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Next billing:</span>
                    <span>{subscription.nextBilling}</span>
                  </div>
                </div>

                {user?.stripe_customer_id && (
                  <Button className="w-full" onClick={handleManageBilling}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>Your payment history and invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {billingHistory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">{item.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.amount}</p>
                          <Badge className="bg-green-100 text-green-800">{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No billing history available</p>
                  </div>
                )}

                {user?.stripe_customer_id && (
                  <Button variant="outline" className="w-full mt-4">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All Invoices
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailUpdates" className="text-base font-medium">
                    Product Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new features and improvements
                  </p>
                </div>
                <Switch
                  id="emailUpdates"
                  checked={notifications.emailUpdates}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, emailUpdates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="featureAnnouncements" className="text-base font-medium">
                    Feature Announcements
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Be the first to know about new features
                  </p>
                </div>
                <Switch
                  id="featureAnnouncements"
                  checked={notifications.featureAnnouncements}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, featureAnnouncements: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="billingAlerts" className="text-base font-medium">
                    Billing Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Important billing and payment notifications
                  </p>
                </div>
                <Switch
                  id="billingAlerts"
                  checked={notifications.billingAlerts}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, billingAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyDigest" className="text-base font-medium">
                    Weekly Digest
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly summary of your LinkedIn activities
                  </p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={notifications.weeklyDigest}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, weeklyDigest: checked })
                  }
                />
              </div>

              <Button className="w-full">
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter current password"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>

              <Button>
                <Shield className="w-4 h-4 mr-2" />
                Update Password
              </Button>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Request Data Export
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    <X className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile; 