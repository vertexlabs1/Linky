import { Routes, Route, Link } from 'react-router-dom';
import { Activity, Users } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LeadsPage from '@/components/dashboard/LeadsPage';
import TargetsPage from '@/components/dashboard/TargetsPage';
import LinkedInActivityDashboard from '@/components/dashboard/LinkedInActivityDashboard';
import SettingsPage from '@/components/dashboard/SettingsPage';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/activity" element={<LinkedInActivityDashboard />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/targets" element={<TargetsPage />} />
        <Route path="/content" element={<ContentEngine />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
};

// Dashboard Home Component
const DashboardHome = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome to Linky</h1>
        <p className="text-muted-foreground">Your AI-powered LinkedIn wingman</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="text-2xl font-bold text-foreground">156</div>
          <div className="text-muted-foreground">Total Leads</div>
          <div className="text-sm text-primary font-medium">+12% from last month</div>
        </div>
        
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="text-2xl font-bold text-foreground">89</div>
          <div className="text-muted-foreground">Hot Prospects</div>
          <div className="text-sm text-primary font-medium">+5% from last month</div>
        </div>
        
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="text-2xl font-bold text-foreground">456</div>
          <div className="text-muted-foreground">Messages Sent</div>
          <div className="text-sm text-primary font-medium">+8% from last month</div>
        </div>
        
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="text-2xl font-bold text-foreground">23%</div>
          <div className="text-muted-foreground">Response Rate</div>
          <div className="text-sm text-primary font-medium">+2% from last month</div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">LinkedIn Activity</h3>
              <p className="text-sm text-muted-foreground">Monitor your profile activity</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Track your LinkedIn profile views, connections, and engagement in real-time.
          </p>
          <Link to="/dashboard/activity" className="text-primary hover:underline text-sm font-medium">
            View Activity Dashboard →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Lead Management</h3>
              <p className="text-sm text-muted-foreground">Manage your prospects</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Organize and track your LinkedIn connections and potential leads.
          </p>
          <Link to="/dashboard/leads" className="text-primary hover:underline text-sm font-medium">
            View Leads →
          </Link>
        </div>
      </div>
    </div>
  );
};

// Content Engine Component
const ContentEngine = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Content Engine</h1>
        <p className="text-muted-foreground">AI-powered content generation and automation</p>
      </div>
      
      <div className="bg-white rounded-lg border border-border p-6">
        <p className="text-muted-foreground">Content Engine features coming soon...</p>
      </div>
    </div>
  );
};

export default Dashboard;