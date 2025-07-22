import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardWelcome from '@/components/pages/DashboardWelcome';
import Settings from '@/components/Settings';
import ContentManagement from '@/components/features/ContentManagement';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardWelcome />} />
        <Route path="settings" element={<Settings />} />
        <Route path="content" element={<ContentManagement />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;