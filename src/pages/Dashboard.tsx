import { useState } from 'react';
import { ArrowLeft, Settings, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardPreview from '@/components/DashboardPreview';
import Navigation from '@/components/Navigation';

const Dashboard = () => {
  const [user] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'Builder'
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Dashboard Header */}
      <div className="bg-card border-b border-border pt-16">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                {user.plan} Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Leads', value: '1,234', change: '+12%' },
              { label: 'Hot Prospects', value: '89', change: '+5%' },
              { label: 'Email Sent', value: '456', change: '+8%' },
              { label: 'Response Rate', value: '23%', change: '+2%' }
            ].map((stat, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-card hover-lift">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
                <div className="text-sm text-primary font-medium">{stat.change}</div>
              </div>
            ))}
          </div>

          {/* Main Dashboard */}
          <DashboardPreview />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;