import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServerCrash, Home, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

export default function ServerError() {
  const [, setLocation] = useLocation();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4" data-testid="server-error-page">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ServerCrash className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Server Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground text-lg">
            Something went wrong on our end.
          </p>
          <p className="text-sm text-muted-foreground">
            Our team has been notified about this issue. Please try refreshing the page or come back later.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center"
              data-testid="refresh-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button 
              onClick={() => setLocation("/")}
              className="flex items-center"
              data-testid="home-button"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}