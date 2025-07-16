import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Linkedin, 
  Bell, 
  Shield, 
  Globe, 
  Download,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  // User Profile State
  const [userProfile, setUserProfile] = useState({
    firstName: 'Will',
    lastName: 'Stewart',
    email: 'will@98c.org',
    phone: '+1 (555) 123-4567',
    linkedinUrl: 'https://linkedin.com/in/willstewart'
  });

  // Settings State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dataExport, setDataExport] = useState(false);

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log('Settings saved:', {
      userProfile,
      isMonitoring,
      emailNotifications,
      pushNotifications,
      dataExport
    });
  };

  const handleStartMonitoring = () => {
    if (userProfile.linkedinUrl) {
      setIsMonitoring(true);
    }
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
  };

  const validateLinkedInUrl = (url: string) => {
    return url.includes('linkedin.com/in/') && url.startsWith('https://');
  };

  const isUrlValid = userProfile.linkedinUrl ? validateLinkedInUrl(userProfile.linkedinUrl) : true;

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your Linky account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={userProfile.firstName}
                    onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={userProfile.lastName}
                    onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Profile Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Linkedin className="w-5 h-5" />
                <span>LinkedIn Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="linkedin-url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={userProfile.linkedinUrl}
                    onChange={(e) => setUserProfile({...userProfile, linkedinUrl: e.target.value})}
                    className={`flex-1 ${!isUrlValid && userProfile.linkedinUrl ? 'border-red-500' : ''}`}
                  />
                  <Button 
                    onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
                    disabled={!userProfile.linkedinUrl || !isUrlValid}
                    variant={isMonitoring ? "destructive" : "default"}
                  >
                    {isMonitoring ? 'Stop' : 'Start'} Monitoring
                  </Button>
                </div>
                {userProfile.linkedinUrl && !isUrlValid && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Please enter a valid LinkedIn profile URL
                  </p>
                )}
                {isUrlValid && userProfile.linkedinUrl && (
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Valid LinkedIn profile URL
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your public LinkedIn profile URL to start monitoring your activity. 
                  We'll track your profile views, connections, and engagement.
                </p>
              </div>

              {isMonitoring && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700">Monitoring active - Updates every 15 minutes</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get real-time alerts</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy & Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data-export">Data Export</Label>
                  <p className="text-sm text-muted-foreground">Allow data export for analysis</p>
                </div>
                <Switch
                  id="data-export"
                  checked={dataExport}
                  onCheckedChange={setDataExport}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Delete Account</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                View Public Page
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Linkedin className="w-4 h-4 mr-2" />
                Connect LinkedIn
              </Button>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge variant="secondary">Free</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monitoring</span>
                <Badge variant={isMonitoring ? "default" : "secondary"}>
                  {isMonitoring ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSaveSettings} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 