import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  Crown, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Edit,
  Save,
  X,
  ExternalLink,
  Check,
  Download
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
  company?: string;
  job_title?: string;
  founding_member?: boolean;
  subscription_plan?: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  created_at?: string;
}

const Settings = () => {
  const [isEditing, setIsEditing] = useState(false);
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

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
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
          console.error('Error fetching user data by auth_user_id:', error);
          
          // Try to fetch by email as fallback
          const { data: emailUserData, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .single();

          if (emailError || !emailUserData) {
            console.error('Error fetching user data by email:', emailError);
            // Fallback to auth user data
            const fallbackUser = {
              first_name: authUser.user_metadata?.first_name || 'Demo',
              last_name: authUser.user_metadata?.last_name || 'User',
              email: authUser.email || 'demo@example.com',
              phone: '',
              company: '',
              job_title: '',
              founding_member: true,
              subscription_plan: 'founding_member',
              subscription_status: 'active',
              created_at: authUser.created_at || new Date().toISOString()
            };
            setUser(fallbackUser);
            setUserInfo({
              firstName: fallbackUser.first_name || '',
              lastName: fallbackUser.last_name || '',
              email: fallbackUser.email || '',
              phone: fallbackUser.phone || '',
              company: fallbackUser.company || '',
              jobTitle: fallbackUser.job_title || ''
            });
          } else {
            console.log('Found user by email:', emailUserData.email);
            setUser(emailUserData);
            setUserInfo({
              firstName: emailUserData.first_name || '',
              lastName: emailUserData.last_name || '',
              email: emailUserData.email || '',
              phone: emailUserData.phone || '',
              company: emailUserData.company || '',
              jobTitle: emailUserData.job_title || ''
            });
          }
        } else {
          setUser(userData);
          setUserInfo({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            company: userData.company || '',
            jobTitle: userData.job_title || ''
          });
        }
      } else {
        // No auth user, show demo data
        const demoUser = {
          first_name: 'Demo',
          last_name: 'User',
          email: 'demo@example.com',
          phone: '',
          company: '',
          job_title: '',
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
          company: demoUser.company || '',
          jobTitle: demoUser.job_title || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      // For demo purposes, just update local state
              setUser(prev => prev ? {
          ...prev,
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phone,
          company: userInfo.company,
          job_title: userInfo.jobTitle,
        } : null);
      setIsEditing(false);
      alert('Profile updated successfully! (Demo mode)');
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phone,
          company: userInfo.company,
          job_title: userInfo.jobTitle,
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
          company: userInfo.company,
          job_title: userInfo.jobTitle,
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
        company: user.company || '',
        jobTitle: user.job_title || ''
      });
    }
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        alert('Failed to update password. Please try again.');
      } else {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Password updated successfully!');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to update password. Please try again.');
    }
  };

  const handleManageBilling = () => {
    if (user?.stripe_customer_id) {
      console.log('Opening Stripe Customer Portal for customer:', user.stripe_customer_id);
      // In a real app, this would redirect to Stripe Customer Portal
      alert('This would open the Stripe Customer Portal for billing management.');
    } else {
      console.log('No Stripe customer ID found');
      alert('Billing management will be available once payment processing is set up.');
    }
  };

  const getSubscriptionDetails = () => {
    // Check if user is admin
    const isAdmin = user?.email === 'tyler@vxlabs.co';
    
    if (isAdmin) {
      return {
        plan: 'Administrator',
        status: 'Active',
        billingCycle: 'N/A',
        nextBilling: 'N/A',
        price: 'N/A',
        features: [
          'Full access to all features',
          'Admin panel access',
          'User management',
          'System administration',
          'Unlimited access'
        ]
      };
    }
    
    if (user?.founding_member) {
      return {
        plan: 'Founding Member',
        status: 'Active',
        billingCycle: '3 Months Special',
        nextBilling: 'Auto-upgrade to Prospector ($75/month)',
        price: '$50 (3 months)',
        features: [
          'Early access to all features',
          'Special founding member pricing',
          'Direct product feedback access',
          'VIP community access',
          'Priority customer support',
          'Exclusive founding member badge'
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
      date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Jan 15, 2024',
      description: 'Founding Member - 3 Month Special',
              amount: '$50.00',
      status: 'Paid',
      invoice: 'FM-2024-001'
    }
  ] : [];

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account, subscription, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
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
                        {(userInfo.firstName[0] || 'D')}{(userInfo.lastName[0] || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {userInfo.firstName} {userInfo.lastName}
                        {user?.founding_member && (
                          <Crown className="w-5 h-5 text-yellow-600" />
                        )}
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

            {/* Account Status */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {user?.founding_member ? (
                      <Crown className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge className={user?.founding_member ? "bg-yellow-100 text-yellow-800 mb-2" : "bg-gray-100 text-gray-800 mb-2"}>
                      {subscription.plan}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'January 2024'}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-foreground">Status</p>
                    <p className={`text-sm ${subscription.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>
                      {subscription.status}
                    </p>
                  </div>

                  {user?.founding_member && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Founding Member</span>
                      </div>
                      <p className="text-xs text-yellow-700">
                        Thank you for believing in Linky from the beginning!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription details and benefits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{subscription.plan}</p>
                    <p className="text-sm text-muted-foreground">{subscription.price}</p>
                  </div>
                  <Badge className={subscription.status === 'Active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {subscription.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Billing Cycle:</span>
                    <span className="font-medium">{subscription.billingCycle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>After 3 months:</span>
                    <span className="font-medium text-orange-600">{subscription.nextBilling}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Plan Benefits</h4>
                  <ul className="space-y-1">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-3 h-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {user?.stripe_customer_id && (
                  <Button className="w-full" onClick={handleManageBilling}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
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
                  <div className="space-y-3">
                    {billingHistory.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">{payment.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{payment.amount}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {payment.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No billing history available</p>
                  </div>
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
                Choose how you want to be notified about updates and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Product Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new features and product updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, emailUpdates: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Feature Announcements</p>
                    <p className="text-sm text-muted-foreground">
                      Be the first to know when new features launch
                    </p>
                  </div>
                  <Switch
                    checked={notifications.featureAnnouncements}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, featureAnnouncements: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Billing Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Important notifications about your subscription and payments
                    </p>
                  </div>
                  <Switch
                    checked={notifications.billingAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, billingAlerts: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary of your activity and insights
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, weeklyDigest: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleChangePassword} className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Additional security and account management options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline" className="w-full">
                    Enable 2FA
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Download Your Data</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export all your account data and activity
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Request Data Export
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete your account and all data
                  </p>
                  <Button variant="destructive" className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings; 