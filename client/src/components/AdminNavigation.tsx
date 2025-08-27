import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Shield, Menu, LogOut, User, BarChart3, Package, Users, Gavel, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

interface AdminNavigationProps {
  goldPrice: number;
  user: any;
}

export default function AdminNavigation({ goldPrice, user }: AdminNavigationProps) {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/auth";
    } catch (error) {
      window.location.href = "/auth";
    }
  };

  // No navigation items in the top navbar - they're in the admin tabs

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95" data-testid="admin-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Button 
                variant="ghost" 
                className="text-2xl font-serif font-bold text-primary p-0 hover:bg-transparent"
                onClick={() => setLocation("/")}
                data-testid="admin-logo"
              >
                <Shield className="h-6 w-6 mr-2" />
                GoldVault Pro Admin
              </Button>
            </div>
            
            {/* No navigation items in navbar - they're in the admin dashboard tabs */}
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Gold Price Display */}
            <div className="flex items-center bg-muted rounded-lg px-3 py-1" data-testid="admin-gold-price-display">
              <span className="text-2xl text-primary mr-2">🪙</span>
              <span className="text-sm font-medium">
                Gold: ${goldPrice.toFixed(2)}/oz
              </span>
            </div>

            {/* Admin User Info */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-3 py-1 bg-primary/10 rounded-lg">
                <User className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {user?.firstName || 'Admin'}
                </span>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                size="sm"
                data-testid="admin-logout-button"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="admin-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <span className="font-semibold">Admin Dashboard</span>
                    <div className="text-sm text-muted-foreground">
                      Gold: ${goldPrice.toFixed(2)}/oz
                    </div>
                  </div>
                  
                  <div className="flex items-center px-3 py-2">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm">{user?.firstName || 'Admin'}</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="justify-start text-red-600 hover:text-red-700"
                    data-testid="admin-mobile-logout"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}