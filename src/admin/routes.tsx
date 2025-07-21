import React from 'react';
import { Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import UsersPage from './pages/UsersPage';

// Lazy load other admin pages to reduce bundle size
const SubscriptionsPage = React.lazy(() => import('./pages/SubscriptionsPage'));
const NewsletterPage = React.lazy(() => import('./pages/NewsletterPage'));
const PromotionsPage = React.lazy(() => import('./pages/PromotionsPage'));
const StripeEventsPage = React.lazy(() => import('./pages/StripeEventsPage'));
const RolesPage = React.lazy(() => import('./pages/RolesPage'));

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="users" element={<UsersPage />} />
    <Route 
      path="subscriptions" 
      element={
        <React.Suspense fallback={<div>Loading...</div>}>
          <SubscriptionsPage />
        </React.Suspense>
      } 
    />
    <Route 
      path="newsletter" 
      element={
        <React.Suspense fallback={<div>Loading...</div>}>
          <NewsletterPage />
        </React.Suspense>
      } 
    />
    <Route 
      path="promotions" 
      element={
        <React.Suspense fallback={<div>Loading...</div>}>
          <PromotionsPage />
        </React.Suspense>
      } 
    />
    <Route 
      path="stripe-events" 
      element={
        <React.Suspense fallback={<div>Loading...</div>}>
          <StripeEventsPage />
        </React.Suspense>
      } 
    />
    <Route 
      path="roles" 
      element={
        <React.Suspense fallback={<div>Loading...</div>}>
          <RolesPage />
        </React.Suspense>
      } 
    />
  </Route>
); 