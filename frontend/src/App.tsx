import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HouseholdProvider } from "@/contexts/HouseholdContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import JoinHousehold from "./pages/JoinHousehold";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import HouseholdSettings from "./pages/HouseholdSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <HouseholdProvider>
          <Toaster />
          <Sonner
            position="top-center"
            toastOptions={{
              classNames: {
                error: 'bg-destructive text-destructive-foreground border-destructive',
                success: 'bg-success text-success-foreground',
              },
            }}
          />
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/join" element={<JoinHousehold />} />

              {/* Protected Routes with Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="shared" element={<Dashboard />} />
                <Route path="expiring" element={<Dashboard />} />
                <Route path="settings" element={<HouseholdSettings />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </HouseholdProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
