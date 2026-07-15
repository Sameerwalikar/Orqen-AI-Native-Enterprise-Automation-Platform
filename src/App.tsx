import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Agents from "./pages/Agents";
import Vectors from "./pages/Vectors";
import Workflows from "./pages/Workflows";
import Pipelines from "./pages/Pipelines";
import Connectors from "./pages/Connectors";
import Schedules from "./pages/Schedules";
import Webhooks from "./pages/Webhooks";
import Analytics from "./pages/Analytics";
import Organizations from "./pages/Organizations";
import NotFound from "./pages/NotFound";
import CookieConsent from "./components/CookieConsent";
import SmoothScroll from "./components/SmoothScroll";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { cookieService } from "@/lib/utils/cookies";

const queryClient = new QueryClient();

const ThemedLayout = () => {
  const savedTheme = cookieService.hasConsent() ? cookieService.getTheme() : 'system';
  
  return (
    <ThemeProvider attribute="class" defaultTheme={savedTheme} enableSystem>
      <Outlet />
    </ThemeProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SmoothScroll />
      <CookieConsent />
      <BrowserRouter>
        <AuthProvider>
          <WebSocketProvider>
            <Routes>
            {/* Landing page without theme switching (always light) */}
            <Route path="/" element={<Index />} />

            {/* All other routes wrapped with ThemeProvider (dark/light enabled) */}
            <Route element={<ThemedLayout />}>
              {/* Public routes - redirect to dashboard if authenticated */}
              <Route 
                path="/sign-up" 
                element={
                  <PublicRoute>
                    <SignUp />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/sign-in" 
                element={
                  <PublicRoute>
                    <SignIn />
                  </PublicRoute>
                } 
              />
              
              {/* Protected routes - require authentication */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/agents" 
                element={
                  <ProtectedRoute>
                    <Agents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vectors" 
                element={
                  <ProtectedRoute>
                    <Vectors />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/workflows" 
                element={
                  <ProtectedRoute>
                    <Workflows />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pipelines" 
                element={
                  <ProtectedRoute>
                    <Pipelines />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/connectors" 
                element={
                  <ProtectedRoute>
                    <Connectors />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/schedules" 
                element={
                  <ProtectedRoute>
                    <Schedules />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/webhooks" 
                element={
                  <ProtectedRoute>
                    <Webhooks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizations" 
                element={
                  <ProtectedRoute>
                    <Organizations />
                  </ProtectedRoute>
                } 
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
            </Routes>
          </WebSocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
