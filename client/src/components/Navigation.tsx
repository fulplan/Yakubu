import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Shield, Menu, LogOut, User, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

interface NavigationProps {
  goldPrice: number;
  onLogin: () => void;
  onRegister: () => void;
  user?: any;
}

export default function Navigation({ goldPrice, onLogin, onRegister, user }: NavigationProps) {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setLocation("/");
    } catch (error) {
      setLocation("/");
    }
  };

  const publicNavItems = [
    { href: "/", label: "Home" },
    { href: "/#services", label: "Services" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/tracking", label: "Tracking" },
    { href: "/#about", label: "About" },
  ];

  const userNavItems = user?.role === "admin" ? [
    { href: "/admin", label: "Admin Dashboard" },
    { href: "/tracking", label: "Tracking" },
  ] : user ? [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/consignment", label: "Consignment" },
    { href: "/support", label: "Support" },
    { href: "/tracking", label: "Tracking" },
  ] : publicNavItems;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Button 
                variant="ghost" 
                className="text-2xl font-serif font-bold text-primary p-0 hover:bg-transparent"
                onClick={() => setLocation("/")}
                data-testid="logo"
              >
                <Shield className="h-6 w-6 mr-2" />
                GoldVault Pro
              </Button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-8">
                {userNavItems.map((item, index) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={`text-muted-foreground hover:text-foreground px-3 py-2 text-sm transition-colors ${index === 0 ? 'text-primary font-medium' : ''}`}
                    onClick={() => {
                      if (item.href.startsWith('/#')) {
                        const element = document.querySelector(item.href.substring(1));
                        element?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setLocation(item.href);
                      }
                    }}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Gold Price Display */}
            <div className="flex items-center bg-muted rounded-lg px-3 py-1" data-testid="gold-price-display">
              <span className="text-2xl text-primary mr-2">🪙</span>
              <span className="text-sm font-medium">
                Gold: ${goldPrice.toFixed(2)}/oz
              </span>
            </div>

            {/* User Authentication */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/dashboard")}
                  className="flex items-center"
                  data-testid="user-menu"
                >
                  <User className="h-4 w-4 mr-2" />
                  {user.firstName || user.email || 'Account'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  size="sm"
                  data-testid="logout-button"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={onLogin}
                  className="text-muted-foreground hover:text-foreground font-medium text-sm"
                  data-testid="login-button"
                >
                  Login
                </Button>
                <Button
                  onClick={onRegister}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                  data-testid="register-button"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="mobile-menu-trigger">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 senior-friendly" data-testid="mobile-menu">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Gold Price (Mobile) */}
                  <div className="flex items-center bg-muted rounded-lg px-4 py-3 mb-6 mobile-optimized">
                    <span className="text-xl text-primary mr-2">🪙</span>
                    <span className="text-base font-medium">
                      Gold: ${goldPrice.toFixed(2)}/oz
                    </span>
                  </div>

                  {/* Navigation Items */}
                  {userNavItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className="justify-start mobile-optimized text-base py-3"
                      onClick={() => {
                        if (item.href.startsWith('/#')) {
                          const element = document.querySelector(item.href.substring(1));
                          element?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          setLocation(item.href);
                        }
                        setIsMenuOpen(false);
                      }}
                      data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                    >
                      {item.label}
                    </Button>
                  ))}

                  {/* User Actions (Mobile) */}
                  <div className="border-t border-border pt-4 mt-4">
                    {user ? (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setLocation("/dashboard");
                            setIsMenuOpen(false);
                          }}
                          data-testid="mobile-dashboard"
                        >
                          <User className="h-4 w-4 mr-2" />
                          {user.firstName || user.email || 'Account'}
                        </Button>
                        {(user as any)?.role === "admin" && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setLocation("/admin");
                              setIsMenuOpen(false);
                            }}
                            data-testid="mobile-admin"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Admin
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleLogout}
                          data-testid="mobile-logout"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            onLogin();
                            setIsMenuOpen(false);
                          }}
                          data-testid="mobile-login"
                        >
                          Login
                        </Button>
                        <Button
                          className="w-full"
                          onClick={() => {
                            onRegister();
                            setIsMenuOpen(false);
                          }}
                          data-testid="mobile-register"
                        >
                          Get Started
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
