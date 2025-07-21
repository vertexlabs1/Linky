import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SetupPassword from "./pages/SetupPassword";
import FoundingMemberSuccess from "./pages/FoundingMemberSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { adminRoutes } from "./admin/routes";

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
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/setup-password" element={<SetupPassword />} />
            <Route path="/founding-member-success" element={<FoundingMemberSuccess />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {adminRoutes}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
