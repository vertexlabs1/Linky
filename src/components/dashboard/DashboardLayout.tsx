import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Target, 
  MessageSquare, 
  Activity,
  Search, 
  Download, 
  Maximize2, 
  Menu,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
  Copy,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const [user] = useState({
    name: 'Will Stewart',
    email: 'will@98c.org',
    avatar: 'WS'
  });

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Activity', href: '/dashboard/activity', icon: Activity },
    { name: 'Leads', href: '/dashboard/leads', icon: Users },
    { name: 'Targets', href: '/dashboard/targets', icon: Target },
    { name: 'Content Engine', href: '/dashboard/content', icon: MessageSquare },
  ];

  const insightsNavigation = [
    { name: 'Bookings', href: '/dashboard/insights/bookings', icon: Activity },
    { name: 'Routing', href: '/dashboard/insights/routing', icon: Activity },
    { name: 'Router Position', href: '/dashboard/insights/router-position', icon: Activity },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-border flex flex-col">
        {/* User Profile Section */}
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                <div className="flex items-center space-x-3 w-full">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-green-500 text-white text-sm font-medium">
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Utility Links */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <ExternalLink className="w-4 h-4 mr-2" />
            View public page
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Copy className="w-4 h-4 mr-2" />
            Copy public page link
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Gift className="w-4 h-4 mr-2" />
            Earn 20% referral
          </Button>
          <Link to="/dashboard/settings">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          © 2025 Linky, Inc. v.1.0.0
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/dashboard/activity' && 'LinkedIn Activity'}
                {location.pathname === '/dashboard/leads' && 'Leads'}
                {location.pathname === '/dashboard/targets' && 'Targets'}
                {location.pathname === '/dashboard/content' && 'Content Engine'}
                {location.pathname === '/dashboard/settings' && 'Settings'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {location.pathname === '/dashboard' && 'Manage your LinkedIn activity and leads'}
                {location.pathname === '/dashboard/activity' && 'Monitor your LinkedIn profile activity'}
                {location.pathname === '/dashboard/leads' && 'Manage your prospects and connections'}
                {location.pathname === '/dashboard/targets' && 'Track your target companies and contacts'}
                {location.pathname === '/dashboard/content' && 'AI-powered content generation and automation'}
                {location.pathname === '/dashboard/settings' && 'Configure your account and preferences'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button size="sm">
                <Maximize2 className="w-4 h-4 mr-2" />
                +
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 