import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  Users, 
  CreditCard, 
  Mail, 
  Gift, 
  Activity, 
  Settings, 
  LogOut,
  Shield,
  TrendingUp,
  Calendar
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: TrendingUp,
      current: location.pathname === '/admin'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: location.pathname.startsWith('/admin/users')
    },
    {
      name: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: CreditCard,
      current: location.pathname.startsWith('/admin/subscriptions')
    },
    {
      name: 'Newsletter',
      href: '/admin/newsletter',
      icon: Mail,
      current: location.pathname.startsWith('/admin/newsletter')
    },
    {
      name: 'Promotions',
      href: '/admin/promotions',
      icon: Gift,
      current: location.pathname.startsWith('/admin/promotions')
    },
    {
      name: 'Stripe Events',
      href: '/admin/stripe-events',
      icon: Activity,
      current: location.pathname.startsWith('/admin/stripe-events')
    },
    {
      name: 'Roles',
      href: '/admin/roles',
      icon: Shield,
      current: location.pathname.startsWith('/admin/roles')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              You don't have permission to access the admin portal.
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Linky Admin</h1>
              <Badge variant="secondary" className="ml-2">
                Admin
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.first_name} {user?.last_name}
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 