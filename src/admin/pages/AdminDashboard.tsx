import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useAdminStats } from '../hooks/useAdminApi';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  Mail, 
  Crown, 
  TrendingUp,
  Calendar,
  Activity,
  Gift
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading dashboard data. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Newsletter Subscribers',
      value: stats?.newsletterSubscribers || 0,
      icon: Mail,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Founding Members',
      value: stats?.foundingMembers || 0,
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Recent Signups (7d)',
      value: stats?.recentSignups || 0,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Active Promos',
      value: stats?.activePromos || 0,
      icon: Gift,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your Linky platform metrics and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`border ${stat.borderColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <CreditCard className="h-6 w-6 mb-2" />
              <span>View Subscriptions</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Mail className="h-6 w-6 mb-2" />
              <span>Newsletter</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Activity className="h-6 w-6 mb-2" />
              <span>Stripe Events</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Gift className="h-6 w-6 mb-2" />
              <span>Promo Management</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {stats?.recentSignups || 0} new users signed up in the last 7 days
                </span>
              </div>
              <Badge variant="secondary">Recent</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {stats?.activeSubscriptions || 0} active subscriptions
                </span>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Total revenue: {formatCurrency(stats?.totalRevenue || 0)}
                </span>
              </div>
              <Badge variant="outline">Revenue</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {stats?.activePromos || 0} active promo codes
                </span>
              </div>
              <Badge variant="outline">Promos</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo Management Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Promo Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Gift className="w-4 h-4 mr-2" />
                  View All Active Promos
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Expired Promos
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Promo Analytics
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Promo Types</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Founding Member</span>
                  <Badge variant="secondary">3 months for $25</Badge>
                </div>
                <div className="flex justify-between">
                  <span>1 Week Trial</span>
                  <Badge variant="secondary">Free</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Beta Tester</span>
                  <Badge variant="secondary">50% off</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Early Adopter</span>
                  <Badge variant="secondary">25% off</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 