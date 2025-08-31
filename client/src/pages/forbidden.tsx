import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Forbidden() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4" data-testid="forbidden-page">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground text-lg">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your administrator or try logging in with the correct account.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center"
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
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