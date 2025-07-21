import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SetupPassword from "./pages/SetupPassword";
import FoundingMemberSuccess from "./pages/FoundingMemberSuccess";
import NotFound from "./pages/NotFound";
import { AdminUsers } from "./components/pages/AdminUsers";
import AdminSubscriptions from "./components/pages/AdminSubscriptions";
import AdminNewsletter from "./components/pages/AdminNewsletter";
import AdminPromotions from "./components/pages/AdminPromotions";
import AdminStripeEvents from "./components/pages/AdminStripeEvents";
import AdminPermissions from "./components/pages/AdminRoles";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard/*" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/setup-password" element={<SetupPassword />} />
            <Route path="/founding-member-success" element={<FoundingMemberSuccess />} />
            
            {/* Admin Routes - Direct Access */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/newsletter" element={<AdminNewsletter />} />
            <Route path="/admin/promotions" element={<AdminPromotions />} />
            <Route path="/admin/stripe-events" element={<AdminStripeEvents />} />
            <Route path="/admin/permissions" element={<AdminPermissions />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
