import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
  </div>
);

// Lazy load components
export const LazyAdminDashboard = lazy(() => import('../pages/AdminDashboard'));
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyEmailTemplateEditor = lazy(() => 
  import('./features/EmailTemplateEditor').then(module => ({ default: module.EmailTemplateEditor }))
);
export const LazyUserProfile = lazy(() => import('./UserProfile'));
export const LazySettings = lazy(() => import('./Settings'));

// Wrapper component for lazy loading
export const withSuspense = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Suspense fallback={<LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
};

// Export wrapped components
export const AdminDashboard = withSuspense(LazyAdminDashboard);
export const Dashboard = withSuspense(LazyDashboard);
export const EmailTemplateEditor = withSuspense(LazyEmailTemplateEditor);
export const UserProfile = withSuspense(LazyUserProfile);
export const Settings = withSuspense(LazySettings); 