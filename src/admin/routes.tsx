import React from 'react';
import { Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import { UsersPage } from './pages/UsersPage';
import { HealthPage } from './pages/HealthPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import NewsletterPage from './pages/NewsletterPage';
import PromotionsPage from './pages/PromotionsPage';
import StripeEventsPage from './pages/StripeEventsPage';
import RolesPage from './pages/RolesPage';

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="users" element={<UsersPage />} />
    <Route path="health" element={<HealthPage />} />
    <Route path="subscriptions" element={<SubscriptionsPage />} />
    <Route path="newsletter" element={<NewsletterPage />} />
    <Route path="promotions" element={<PromotionsPage />} />
    <Route path="stripe-events" element={<StripeEventsPage />} />
    <Route path="roles" element={<RolesPage />} />
  </Route>
); 