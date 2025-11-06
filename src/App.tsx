import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import CodeConverter from "./pages/CodeConverter";
import CodeRunner from "./pages/CodeRunner";
import AIChat from "./pages/AIChat";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Debug from "./pages/Debug";
import CodeGeneration from "./pages/CodeGeneration";
import TestGenerator from "./pages/TestGenerator";
import CodeExplanation from "./pages/CodeExplanation";
import DebugRefactor from "./pages/DebugRefactor";
import CodeOptimizer from "./pages/CodeOptimizer";
import DocumentationGenerator from "./pages/DocumentationGenerator";
import SecurityAudit from "./pages/SecurityAudit";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <ErrorBoundary>
            <ThemeProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Auth />} />
              
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="convert" element={<CodeConverter />} />
                <Route path="runner" element={<CodeRunner />} />
                <Route path="chat" element={<AIChat />} />
                <Route path="generate" element={<CodeGeneration />} />
                <Route path="test" element={<TestGenerator />} />
                <Route path="explain" element={<CodeExplanation />} />
                <Route path="debug" element={<DebugRefactor />} />
                <Route path="optimize" element={<CodeOptimizer />} />
                <Route path="docs" element={<DocumentationGenerator />} />
                <Route path="security" element={<SecurityAudit />} />
              </Route>

              <Route path="/profile" element={<DashboardLayout />}>
                <Route index element={<Profile />} />
              </Route>

              <Route path="/history" element={<DashboardLayout />}>
                <Route index element={<History />} />
              </Route>

              {/* Debug route - standalone without layout */}
              <Route path="/debug-tools" element={<Debug />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
