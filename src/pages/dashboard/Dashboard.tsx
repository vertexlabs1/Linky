import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LeadsPage from '@/components/dashboard/LeadsPage';
import TargetsPage from '@/components/dashboard/TargetsPage';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/targets" element={<TargetsPage />} />
        <Route path="/content" element={<ContentEngine />} />
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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