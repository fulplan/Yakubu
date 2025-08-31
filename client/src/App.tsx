import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Forbidden from "@/pages/forbidden";
import ServerError from "@/pages/server-error";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Consignment from "@/pages/consignment";
import Tracking from "@/pages/tracking";
import TrackingPortal from "@/pages/track";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth-page";

function ProtectedRoute({ children, requiredRole = null }: { children: React.ReactNode; requiredRole?: string | null }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  if (requiredRole && (user as any)?.role !== requiredRole) {
    return <Forbidden />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Only redirect if we have a valid user object
  if (isAuthenticated && user) {
    // Redirect authenticated users to appropriate dashboard
    if ((user as any)?.role === "admin") {
      return <Redirect to="/admin" />;
    } else {
      return <Redirect to="/dashboard" />;
    }
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/track" component={TrackingPortal} />
      <Route path="/tracking" component={Tracking} />
      <Route path="/tracking/:consignmentNumber" component={Tracking} />
      
      {/* Public routes - redirect if authenticated */}
      <Route path="/">
        {() => (
          <PublicRoute>
            <Landing />
          </PublicRoute>
        )}
      </Route>
      <Route path="/auth">
        {() => (
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        )}
      </Route>
      <Route path="/home">
        {() => (
          <PublicRoute>
            <Home />
          </PublicRoute>
        )}
      </Route>

      {/* Protected user routes */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/consignment">
        {() => (
          <ProtectedRoute>
            <Consignment />
          </ProtectedRoute>
        )}
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute requiredRole="admin">
            <Admin />
          </ProtectedRoute>
        )}
      </Route>

      {/* Error pages */}
      <Route path="/404" component={NotFound} />
      <Route path="/403" component={Forbidden} />
      <Route path="/500" component={ServerError} />

      {/* Catch-all 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
