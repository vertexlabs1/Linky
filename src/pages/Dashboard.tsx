import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardWelcome from '@/components/pages/DashboardWelcome';
import Settings from '@/components/Settings';
import AdminUsers from '@/components/pages/AdminUsers';
import AdminSubscriptions from '@/components/pages/AdminSubscriptions';
import AdminNewsletter from '@/components/pages/AdminNewsletter';
import AdminPromotions from '@/components/pages/AdminPromotions';
import AdminStripeEvents from '@/components/pages/AdminStripeEvents';
import AdminPermissions from '@/components/pages/AdminRoles';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardWelcome />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Admin Routes */}
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="admin/newsletter" element={<AdminNewsletter />} />
        <Route path="admin/promotions" element={<AdminPromotions />} />
        <Route path="admin/stripe-events" element={<AdminStripeEvents />} />
        <Route path="admin/permissions" element={<AdminPermissions />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;