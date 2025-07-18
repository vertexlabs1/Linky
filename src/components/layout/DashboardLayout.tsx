import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  User, 
  Search, 
  Bell,
  Settings,
  LogOut,
  Menu,
  X
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
import { supabase } from '@/lib/supabase';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface UserData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        // Get current auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          console.log('Auth user found:', authUser.email);
          
          // Try method 1: Fetch user details using auth_user_id
          let { data: userData, error } = await supabase
            .from('users')
            .select('first_name, last_name, email')
            .eq('auth_user_id', authUser.id)
            .single();

          if (error || !userData) {
            console.log('Method 1 failed, trying method 2: fetch by email');
            
            // Try method 2: Fetch user details by email (fallback for unlinked accounts)
            const { data: emailUserData, error: emailError } = await supabase
              .from('users')
              .select('first_name, last_name, email, auth_user_id, id')
              .eq('email', authUser.email)
              .single();

            if (emailError) {
              console.error('Method 2 failed - Error fetching user data by email:', emailError);
              
              // Method 3: Use auth user metadata as final fallback
              console.log('Using auth user metadata as fallback');
              setUser({
                first_name: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User',
                last_name: authUser.user_metadata?.last_name || '',
                email: authUser.email || '',
              });
            } else if (emailUserData) {
              console.log('Found user by email:', emailUserData);
              
              // Check if auth_user_id needs to be linked
              if (!emailUserData.auth_user_id || emailUserData.auth_user_id !== authUser.id) {
                console.log('Attempting to link auth_user_id...');
                
                // Try to update the auth_user_id (might fail due to permissions)
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ auth_user_id: authUser.id })
                  .eq('id', emailUserData.id);
                
                if (updateError) {
                  console.log('Could not auto-link auth_user_id:', updateError.message);
                  console.log('Admin intervention required to link account properly');
                } else {
                  console.log('Successfully linked auth_user_id');
                }
              }
              
              setUser(emailUserData);
            }
          } else {
            console.log('Method 1 success - Found user by auth_user_id');
            setUser(userData);
          }
        } else {
          console.log('No authenticated user found');
          // No auth user, show demo data
          setUser({
            first_name: 'Demo',
            last_name: 'User',
            email: 'demo@example.com',
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        
        // Final fallback - use a default user
        setUser({
          first_name: 'User',
          last_name: '',
          email: '',
        });
      }
    }

    fetchUser();
  }, []);

  const navigation = [
    { name: 'Welcome', href: '/dashboard', icon: Home },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const getUserName = () => {
    if (!user) return 'User';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'User';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName[0] || 'U'}${lastName[0] || ''}`;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left Side - Logo and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                alt="Linky" 
                className="w-8 h-8 object-contain flex-shrink-0"
              />
              <span className="text-xl font-bold text-gray-900">Linky</span>
            </Link>
          </div>

          {/* Right Side - Search and User Profile */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                className="pl-10 w-64 bg-gray-50 border-gray-200"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 px-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{getUserName()}</div>
                    <div className="text-xs text-gray-500">{user?.email || ''}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6">
          {/* Close button for mobile */}
          <div className="flex justify-end lg:hidden mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom section - can add additional links or info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="space-y-2">
              <Link
                to="/dashboard/settings"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 