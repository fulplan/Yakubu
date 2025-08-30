import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import LivePrices from "@/components/LivePrices";
import ChatSupport from "@/components/ChatSupport";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Award, Scroll, TrendingUp, Calendar, Coins } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: consignments = [], isLoading: consignmentsLoading, error: consignmentsError } = useQuery({
    queryKey: ["/api/consignments"],
    enabled: !!user,
  });

  const { data: digitalWill } = useQuery({
    queryKey: ["/api/digital-wills"],
    enabled: !!user,
  });

  const { data: goldPrices } = useQuery({
    queryKey: ["/api/gold-prices"],
  });

  if (isLoading || consignmentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  // Handle consignment loading error
  if (consignmentsError && !consignments) {
    console.error('Error loading consignments:', consignmentsError);
    // Continue with empty array rather than showing error
  }

  const totalWeight = Array.isArray(consignments) ? consignments.reduce((sum: number, c: any) => sum + parseFloat(c.weight || 0), 0) : 0;
  const totalValue = Array.isArray(consignments) ? consignments.reduce((sum: number, c: any) => sum + parseFloat(c.estimatedValue || 0), 0) : 0;
  const currentGoldPrice = (goldPrices as any)?.usd || 2034.50;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation 
          goldPrice={currentGoldPrice}
          onLogin={() => window.location.href = "/api/login"}
          onRegister={() => window.location.href = "/api/login"}
          user={user}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 md:py-8" data-testid="home-dashboard">
        {/* Welcome Header */}
        <div className="mb-4 md:mb-8">
          <div className="bg-primary text-primary-foreground rounded-2xl p-4 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
              <div>
                <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2" data-testid="welcome-message">
                  Welcome back, {(user as any)?.firstName || 'Valued Client'}
                </h1>
                <p className="text-primary-foreground/80 text-sm md:text-base">Portfolio Overview</p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-2xl md:text-4xl font-bold" data-testid="total-value">
                  ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs md:text-sm text-primary-foreground/80">Total Portfolio Value</div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8" data-testid="portfolio-stats">
          <Card className="p-4 md:p-6">
            <div className="flex items-center mb-3 md:mb-4">
              <Coins className="h-6 w-6 md:h-8 md:w-8 text-primary mr-2 md:mr-3" />
              <h3 className="font-semibold text-sm md:text-base">Gold Holdings</h3>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2" data-testid="total-weight">
              {totalWeight.toFixed(1)} oz
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">Current Weight</div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center mb-3 md:mb-4">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary mr-2 md:mr-3" />
              <h3 className="font-semibold text-sm md:text-base">Performance</h3>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-green-600" data-testid="performance">
              +{((currentGoldPrice - 1950) / 1950 * 100).toFixed(1)}%
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">This Year</div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center mb-3 md:mb-4">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary mr-2 md:mr-3" />
              <h3 className="font-semibold text-sm md:text-base">Active Storage</h3>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2" data-testid="active-consignments">
              {Array.isArray(consignments) ? consignments.length : 0}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">Consignments</div>
          </Card>
        </div>

        {/* Live Gold Prices */}
        <LivePrices />

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-4 md:mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="p-6" data-testid="recent-activity">
              <h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
              
              {Array.isArray(consignments) && consignments.length > 0 ? (
                <div className="space-y-4">
                  {Array.isArray(consignments) ? consignments.slice(0, 3).map((consignment: any, index: number) => (
                    <div key={consignment.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`activity-${index}`}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                          <Plus className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">Consignment #{consignment.consignmentNumber}</div>
                          <div className="text-sm text-muted-foreground">{consignment.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">+{consignment.weight} oz</div>
                        <div className="text-sm text-muted-foreground">
                          Value: ${parseFloat(consignment.estimatedValue).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )) : null}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Coins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No consignments yet</h4>
                  <p className="text-muted-foreground mb-4">
                    Start your gold investment journey by creating your first consignment.
                  </p>
                  <Button onClick={() => setLocation("/consignment")} data-testid="button-start-first-consignment">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Consignment
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4" data-testid="quick-actions">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  onClick={() => setLocation("/consignment")}
                  data-testid="button-add-gold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gold
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-view-certificates"
                >
                  <Award className="h-4 w-4 mr-2" />
                  View Certificates
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-manage-will"
                >
                  <Scroll className="h-4 w-4 mr-2" />
                  {digitalWill ? "Manage Will" : "Create Will"}
                </Button>
              </div>
            </Card>

            {/* Gold Price Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gold Price Alert</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1" data-testid="current-gold-price">
                  ${currentGoldPrice.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">per ounce</div>
                <div className="mt-2 text-sm text-green-600">
                  ↑ +1.2% today
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ChatSupport />
      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
