import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Consignment from "@/pages/consignment";
import Tracking from "@/pages/tracking";
import TrackingPortal from "@/pages/track";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth-page";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes available to everyone */}
      <Route path="/track" component={TrackingPortal} />
      
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/tracking" component={Tracking} />
          <Route path="/tracking/:consignmentNumber" component={Tracking} />
        </>
      ) : (user as any)?.role === "admin" ? (
        <>
          <Route path="/" component={Admin} />
          <Route path="/admin" component={Admin} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/consignment" component={Consignment} />
          <Route path="/tracking" component={Tracking} />
          <Route path="/tracking/:consignmentNumber" component={Tracking} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
