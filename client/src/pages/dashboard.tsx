import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Removed isUnauthorizedError import as auth is handled by ProtectedRoute
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Coins, 
  FileText, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Shield,
  Award,
  Calendar,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Wallet,
  Package,
  Home,
  LogOut,
  User,
  Bell,
  BellRing,
  Clock as ClockIcon,
  MapPin,
  CreditCard,
  MessageSquare
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Active tab state for mobile navigation
  const [activeTab, setActiveTab] = useState("portfolio");

  // Check URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['portfolio', 'consignments', 'certificates', 'inheritance', 'tracking', 'notifications', 'claims', 'ownership-requests'].includes(tab)) {
      setActiveTab(tab);
      // Clean up URL without triggering page reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Will Builder State
  const [willData, setWillData] = useState({
    primaryBeneficiary: "",
    relationship: "",
    allocation: 50,
    instructions: "",
  });

  // Ownership Change Request State
  const [ownershipRequest, setOwnershipRequest] = useState({
    consignmentId: "",
    requestedAction: "transfer",
    relationship: "",
    claimReason: "",
    newOwnerName: "",
    newOwnerEmail: "",
    newOwnerPhone: "",
  });

  // Claims view state
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimResponse, setClaimResponse] = useState("");

  // Notification response state
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notificationResponse, setNotificationResponse] = useState("");

  // Auth protection
  // Removed the problematic useEffect that was causing redirects
  // Authentication is now handled by ProtectedRoute in App.tsx

  // Data queries
  const { data: consignments = [], isLoading: consignmentsLoading } = useQuery({
    queryKey: ["/api/consignments"],
    enabled: !!user,
  });

  const { data: digitalWill, isLoading: willLoading } = useQuery({
    queryKey: ["/api/digital-wills"],
    enabled: !!user,
    retry: false,
  });

  const { data: goldPrices } = useQuery({
    queryKey: ["/api/gold-prices"],
  });

  // Fetch user account balance
  const { data: accountBalance = { balance: 0 } } = useQuery({
    queryKey: ["/api/account/balance"],
    enabled: !!user,
  });

  // Fetch user gold balance
  const { data: goldBalance = { totalWeight: 0, totalValue: 0, avgPurity: 0, activeItems: 0 } } = useQuery({
    queryKey: ["/api/gold/balance"],
    enabled: !!user,
  });

  // Fetch user gold holdings
  const { data: goldHoldings = [] } = useQuery({
    queryKey: ["/api/gold/holdings"],
    enabled: !!user,
  });

  // Fetch customer notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  // Fetch account transactions
  const { data: accountTransactions = [] } = useQuery({
    queryKey: ["/api/account/transactions"],
    enabled: !!user,
  });

  // Fetch support tickets
  const { data: supportTickets = [] } = useQuery({
    queryKey: ["/api/support-tickets/mine"],
    enabled: !!user,
  });

  // Fetch user inheritance claims
  const { data: userClaims = [] } = useQuery({
    queryKey: ["/api/claims/mine"],
    enabled: !!user,
  });

  // Fetch ownership change requests
  const { data: ownershipRequests = [] } = useQuery({
    queryKey: ["/api/ownership-change-requests/mine"],
    enabled: !!user,
  });

  // Fetch notification count and summary
  const { data: notificationCount = { count: 0 } } = useQuery({
    queryKey: ["/api/notifications/count"],
    enabled: !!user,
  });

  const { data: notificationSummary = { total: 0, unread: 0, urgent: 0, byType: {} } } = useQuery({
    queryKey: ["/api/notifications/summary"],
    enabled: !!user,
  });

  // Mutations
  const createOwnershipRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'documents') {
          formData.append(key, data[key]);
        }
      });
      if (data.documents) {
        data.documents.forEach((file: File) => {
          formData.append('documents', file);
        });
      }
      return apiRequest("/api/ownership-change-requests", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ownership change request submitted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ownership-change-requests/mine"] });
      setOwnershipRequest({
        consignmentId: "",
        requestedAction: "transfer",
        relationship: "",
        claimReason: "",
        newOwnerName: "",
        newOwnerEmail: "",
        newOwnerPhone: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit ownership change request",
        variant: "destructive"
      });
    }
  });

  const respondToClaimMutation = useMutation({
    mutationFn: async ({ claimId, message }: { claimId: string; message: string }) => {
      return apiRequest(`/api/claims/${claimId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Response sent successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/claims/mine"] });
      setClaimResponse("");
      setSelectedClaim(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive"
      });
    }
  });

  const respondToNotificationMutation = useMutation({
    mutationFn: async ({ notificationId, response, actionType }: { notificationId: string; response: string; actionType?: string }) => {
      return apiRequest(`/api/notifications/${notificationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, actionType }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Response sent successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/summary"] });
      setNotificationResponse("");
      setSelectedNotification(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive"
      });
    }
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/notifications/mark-all-read", {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notifications as read",
        variant: "destructive"
      });
    }
  });

  const createWillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/digital-wills", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Digital Will Created",
        description: "Your digital will has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/digital-wills"] });
    },
    onError: (error) => {
      // Auth handled by ProtectedRoute
      toast({
        title: "Failed to Create Will",
        description: error.message || "An error occurred while creating your digital will.",
        variant: "destructive",
      });
    },
  });

  const addBeneficiaryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/beneficiaries", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Beneficiary Added",
        description: "Beneficiary has been added to your will.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/digital-wills"] });
      setWillData({
        primaryBeneficiary: "",
        relationship: "",
        allocation: 50,
        instructions: "",
      });
    },
    onError: (error) => {
      // Auth handled by ProtectedRoute
      toast({
        title: "Failed to Add Beneficiary",
        description: error.message || "An error occurred while adding the beneficiary.",
        variant: "destructive",
      });
    },
  });

  const deleteBeneficiaryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/beneficiaries/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Beneficiary Removed",
        description: "Beneficiary has been removed from your will.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/digital-wills"] });
    },
    onError: (error) => {
      // Auth handled by ProtectedRoute
      toast({
        title: "Failed to Remove Beneficiary",
        description: error.message || "An error occurred while removing the beneficiary.",
        variant: "destructive",
      });
    },
  });

  const handleCreateWill = () => {
    if (!digitalWill) {
      createWillMutation.mutate({
        status: "draft",
        totalAllocation: 0,
      });
    }
  };

  const handleAddBeneficiary = () => {
    if (!willData.primaryBeneficiary || !willData.relationship || !willData.allocation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!digitalWill) {
      toast({
        title: "Create Will First",
        description: "Please create a digital will before adding beneficiaries.",
        variant: "destructive",
      });
      return;
    }

    addBeneficiaryMutation.mutate({
      willId: digitalWill.id,
      fullName: willData.primaryBeneficiary,
      relationship: willData.relationship,
      percentage: willData.allocation,
      instructions: willData.instructions,
    });
  };

  const handleDeleteBeneficiary = (id: string) => {
    deleteBeneficiaryMutation.mutate(id);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/auth";
    } catch (error) {
      window.location.href = "/auth";
    }
  };

  if (isLoading || consignmentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentGoldPrice = goldPrices?.usd || 2034.50;
  const totalWeight = goldBalance.totalWeight || 0;
  const totalValue = goldBalance.totalValue || 0;
  const currentMarketValue = totalWeight * currentGoldPrice;
  const profitLoss = currentMarketValue - totalValue;
  const totalAllocation = digitalWill?.beneficiaries?.reduce((sum: number, b: any) => sum + b.percentage, 0) || 0;

  // Mobile Bottom Navigation Component
  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 md:hidden shadow-lg">
      <div className="grid grid-cols-5 px-1 py-3 safe-area-inset-bottom">
        {[
          { id: 'portfolio', icon: Home, label: 'Portfolio', shortLabel: 'Home' },
          { id: 'consignments', icon: Package, label: 'Consignments', shortLabel: 'Assets' },
          { id: 'inheritance', icon: Shield, label: 'Inheritance', shortLabel: 'Will' },
          { id: 'claims', icon: FileText, label: 'Claims', shortLabel: 'Claims' },
          { id: 'notifications', icon: Bell, label: 'Notifications', shortLabel: 'Alerts', badge: notificationCount.count }
        ].map(({ id, icon: Icon, label, shortLabel, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center py-1 px-0.5 min-h-[60px] transition-all duration-200 rounded-lg mx-0.5 relative ${
              activeTab === id 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            data-testid={`bottom-nav-${id}`}
            aria-label={label}
          >
            <Icon className={`h-5 w-5 mb-1 ${activeTab === id ? 'scale-110' : ''} transition-transform`} />
            {badge && badge > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {badge > 99 ? '99+' : badge}
              </div>
            )}
            <span className="text-[9px] font-medium leading-tight text-center max-w-[50px] truncate">
              {shortLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Mobile Top Navigation Component with Back Navigation
  const MobileTopNav = () => {
    const getPageTitle = () => {
      switch (activeTab) {
        case 'portfolio': return 'Portfolio';
        case 'consignments': return 'My Assets';
        case 'certificates': return 'Documents';
        case 'inheritance': return 'Digital Will';
        case 'tracking': return 'Tracking';
        default: return 'Dashboard';
      }
    };

    return (
      <div className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-40 md:hidden">
        <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
          <div className="flex items-center space-x-3">
            {activeTab !== 'portfolio' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('portfolio')}
                className="p-1 h-8 w-8"
                data-testid="mobile-back"
                aria-label="Go back to Portfolio"
              >
                <ExternalLink className="h-4 w-4 rotate-180" />
              </Button>
            )}
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-primary mr-2" />
              <div>
                <span className="text-base font-serif font-bold text-primary">GoldVault</span>
                <p className="text-xs text-muted-foreground leading-none">{getPageTitle()}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[80px]">
              {user?.firstName || user?.email?.split('@')[0] || 'User'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-1.5 h-8 w-8"
              data-testid="mobile-logout"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

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

      {/* Mobile Top Navigation */}
      <MobileTopNav />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-8" data-testid="dashboard-page">
        {/* Header - Desktop Only */}
        <div className="mb-4 md:mb-8 hidden md:block">
          <h1 className="text-4xl font-serif font-bold mb-4">Portfolio Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Manage your gold investments, certificates, and inheritance planning
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-8" data-testid="dashboard-tabs">
          {/* Desktop Tabs - Hidden on Mobile */}
          <TabsList className="hidden md:grid w-full grid-cols-9 gap-1 h-auto p-2 bg-muted">
            <TabsTrigger 
              value="portfolio" 
              data-testid="tab-portfolio"
              className="flex flex-col items-center justify-center p-4 text-sm min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <span className="font-medium">Portfolio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="consignments" 
              data-testid="tab-consignments"
              className="flex flex-col items-center justify-center p-4 text-sm min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <span className="font-medium">Consignments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="certificates" 
              data-testid="tab-certificates"
              className="flex flex-col items-center justify-center p-4 text-sm min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <span className="font-medium">Certificates</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inheritance" 
              data-testid="tab-inheritance"
              className="flex flex-col items-center justify-center p-4 text-sm min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <span className="font-medium">Inheritance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tracking" 
              data-testid="tab-tracking"
              className="flex flex-col items-center justify-center p-4 text-sm min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <span className="font-medium">Tracking</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              data-testid="tab-transactions"
              className="flex flex-col items-center justify-center p-4 text-sm min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <span className="font-medium">Transactions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              data-testid="tab-notifications"
              className="flex flex-col items-center justify-center p-4 text-sm min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <div className="relative">
                <span className="font-medium">Notifications</span>
                {notificationCount.count > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount.count > 99 ? '99+' : notificationCount.count}
                  </div>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="claims" 
              data-testid="tab-claims"
              className="flex flex-col items-center justify-center p-4 text-sm min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <span className="font-medium">Claims</span>
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4 md:space-y-6" data-testid="portfolio-content">
            {/* Account Balance - Top Priority for Mobile */}
            <Card data-testid="account-balance" className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Wallet className="h-5 w-5 mr-2 text-primary" />
                  Account Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-primary">
                    ${accountBalance.balance ? accountBalance.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Available funds</p>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Summary Section - 2 Column Grid on Mobile */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Portfolio Summary
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card data-testid="stat-total-value">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <p className="text-3xl font-bold text-primary">
                        ${currentMarketValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                      <p className={`text-xs mt-1 ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })} profit
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-total-weight">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gold Holdings</p>
                      <p className="text-3xl font-bold">{totalWeight.toFixed(4)} oz</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {goldBalance.avgPurity.toFixed(1)}% avg purity | {goldBalance.activeItems} items
                      </p>
                    </div>
                    <Coins className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-active-consignments">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Items</p>
                      <p className="text-3xl font-bold">{consignments.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Stored consignments
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-average-purity">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Purity</p>
                      <p className="text-3xl font-bold">
                        {consignments.length > 0 
                          ? (consignments.reduce((sum: number, c: any) => sum + parseFloat(c.purity || 0), 0) / consignments.length).toFixed(1)
                          : '0'}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gold quality
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>

            {/* Live Gold Prices - Compact Section */}
            <Card data-testid="live-gold-prices" className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Coins className="h-4 w-4 mr-2 text-primary" />
                  Live Gold Prices (LBMA/COMEX)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">USD</p>
                      <p className="text-lg font-bold">${currentGoldPrice.toFixed(2)}</p>
                      <p className={`text-xs ${goldPrices?.change24h?.usd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {goldPrices?.change24h?.usd >= 0 ? '+' : ''}{goldPrices?.change24h?.usd?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">GBP</p>
                      <p className="text-lg font-bold">£{goldPrices?.gbp?.toFixed(2) || '1,628.00'}</p>
                      <p className={`text-xs ${goldPrices?.change24h?.gbp >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {goldPrices?.change24h?.gbp >= 0 ? '+' : ''}{goldPrices?.change24h?.gbp?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">EUR</p>
                      <p className="text-lg font-bold">€{goldPrices?.eur?.toFixed(2) || '1,885.00'}</p>
                      <p className={`text-xs ${goldPrices?.change24h?.eur >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {goldPrices?.change24h?.eur >= 0 ? '+' : ''}{goldPrices?.change24h?.eur?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Last updated: {goldPrices?.lastUpdated ? new Date(goldPrices.lastUpdated).toLocaleTimeString() : 'Now'}
                </p>
              </CardContent>
            </Card>

            {/* Real-time Portfolio Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card data-testid="performance-metrics">
                <CardHeader>
                  <CardTitle>Portfolio Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Current Market Value</span>
                      <span className="font-bold text-primary">${currentMarketValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Original Investment</span>
                      <span className="font-bold">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Profit/Loss</span>
                      <span className={`font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Unrealized P&L</span>
                      <span className={`font-bold ${(totalWeight * currentGoldPrice) - totalValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs((totalWeight * currentGoldPrice) - totalValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        {(totalWeight * currentGoldPrice) - totalValue >= 0 ? ' ↗' : ' ↘'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Return (%)</span>
                      <span className={`font-bold ${(totalWeight * currentGoldPrice) - totalValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalValue > 0 ? (((totalWeight * currentGoldPrice) - totalValue) / totalValue * 100).toFixed(2) : '0.00'}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="storage-breakdown">
                <CardHeader>
                  <CardTitle>Storage Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {consignments.length > 0 ? (
                      consignments.map((consignment: any, index: number) => (
                        <div key={consignment.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <span className="text-sm font-medium">#{consignment.consignmentNumber}</span>
                            <p className="text-xs text-muted-foreground">{consignment.purity}% purity</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{consignment.weight} oz</span>
                            <p className="text-xs text-muted-foreground">${(parseFloat(consignment.weight) * currentGoldPrice).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No gold holdings yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card data-testid="recent-activity">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {consignments.length > 0 ? (
                  <div className="space-y-4">
                    {consignments.slice(0, 5).map((consignment: any, index: number) => (
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
                          <Badge variant={consignment.status === 'stored' ? 'default' : 'secondary'}>
                            {consignment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Coins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No consignments yet</h4>
                    <p className="text-muted-foreground">Start your gold investment journey today.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consignments Tab */}
          <TabsContent value="consignments" className="space-y-4 md:space-y-6" data-testid="consignments-content">
            <Card>
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                <CardTitle className="text-lg md:text-xl">Your Gold Consignments</CardTitle>
                <Button 
                  onClick={() => window.location.href = "/consignment"} 
                  data-testid="button-new-consignment"
                  className="min-h-[44px] px-4 md:px-6 text-sm md:text-base touch-manipulation w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Consignment
                </Button>
              </CardHeader>
              <CardContent>
                {consignments.length > 0 ? (
                  <div className="space-y-4">
                    {consignments.map((consignment: any) => (
                      <Card key={consignment.id} className="p-3 md:p-4" data-testid={`consignment-${consignment.id}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm md:text-base">#{consignment.consignmentNumber}</h4>
                            <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-0">{consignment.description}</p>
                            <div className="grid grid-cols-1 md:flex md:items-center md:gap-4 gap-1 md:mt-2 text-xs md:text-sm">
                              <span>Weight: {consignment.weight} oz</span>
                              <span>Purity: {consignment.purity}%</span>
                              <span>Value: ${parseFloat(consignment.estimatedValue).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col md:text-right items-center md:items-end justify-between md:justify-start gap-2">
                            <Badge variant={consignment.status === 'stored' ? 'default' : 'secondary'} className="text-xs">
                              {consignment.status}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/tracking/${consignment.consignmentNumber}`}
                              data-testid={`button-track-${consignment.id}`}
                              className="text-xs md:text-sm px-2 md:px-3"
                            >
                              <ExternalLink className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              Track
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 px-4">
                    <Shield className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-base md:text-lg font-semibold mb-2">No consignments yet</h4>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      Create your first consignment to start storing gold securely.
                    </p>
                    <Button onClick={() => window.location.href = "/consignment"} data-testid="button-create-first" className="w-full md:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Consignment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4 md:space-y-6" data-testid="certificates-content">
            <Card>
              <CardHeader>
                <CardTitle>Storage Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                {consignments.filter((c: any) => c.certificateUrl).length > 0 ? (
                  <div className="space-y-4">
                    {consignments.filter((c: any) => c.certificateUrl).map((consignment: any) => (
                      <div key={consignment.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`certificate-${consignment.id}`}>
                        <div className="flex items-center">
                          <Award className="h-8 w-8 text-primary mr-3" />
                          <div>
                            <h4 className="font-semibold">Certificate #{consignment.consignmentNumber}</h4>
                            <p className="text-sm text-muted-foreground">{consignment.description}</p>
                          </div>
                        </div>
                        <Button variant="outline" data-testid={`button-download-${consignment.id}`}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No certificates available</h4>
                    <p className="text-muted-foreground">
                      Certificates will be generated once your consignments are processed and stored.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4 md:space-y-6" data-testid="tracking-content">
            <Card>
              <CardHeader>
                <CardTitle>Track Your Consignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consignments.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground mb-4">Click on any consignment to view detailed tracking information.</p>
                      {consignments.map((consignment: any) => (
                        <Card key={consignment.id} className="p-4 cursor-pointer hover:bg-muted transition-colors" 
                              onClick={() => window.location.href = `/tracking/${consignment.consignmentNumber}`}
                              data-testid={`tracking-item-${consignment.id}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">#{consignment.consignmentNumber}</h4>
                              <p className="text-sm text-muted-foreground">{consignment.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={consignment.status === 'stored' ? 'default' : 'secondary'}>
                                {consignment.status}
                              </Badge>
                              <Button variant="outline" size="sm" data-testid={`track-btn-${consignment.id}`}>
                                Track Details
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No consignments to track</h4>
                      <p className="text-muted-foreground mb-4">
                        Create your first consignment to start tracking.
                      </p>
                      <Button onClick={() => window.location.href = "/consignment"} data-testid="button-create-first-tracking">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Consignment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inheritance Tab */}
          <TabsContent value="inheritance" className="space-y-4 md:space-y-6" data-testid="inheritance-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              {/* Will Builder */}
              <Card data-testid="will-builder">
                <CardHeader>
                  <CardTitle>
                    {digitalWill ? "Add Beneficiary" : "Create Digital Will"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!digitalWill ? (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Digital Will Found</h4>
                      <p className="text-muted-foreground mb-4">
                        Create a digital will to manage inheritance of your gold assets.
                      </p>
                      <Button 
                        onClick={handleCreateWill}
                        disabled={createWillMutation.isPending}
                        data-testid="button-create-will"
                      >
                        {createWillMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Digital Will
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="beneficiaryName">Beneficiary Name *</Label>
                        <Input
                          id="beneficiaryName"
                          type="text"
                          placeholder="Full legal name"
                          value={willData.primaryBeneficiary}
                          onChange={(e) => setWillData({ ...willData, primaryBeneficiary: e.target.value })}
                          data-testid="input-beneficiary-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="relationship">Relationship *</Label>
                        <Select 
                          value={willData.relationship} 
                          onValueChange={(value) => setWillData({ ...willData, relationship: value })}
                        >
                          <SelectTrigger data-testid="select-relationship">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="allocation">Allocation Percentage *</Label>
                        <Input
                          id="allocation"
                          type="number"
                          min="1"
                          max="100"
                          placeholder="50"
                          value={willData.allocation}
                          onChange={(e) => setWillData({ ...willData, allocation: parseInt(e.target.value) || 0 })}
                          data-testid="input-allocation"
                        />
                      </div>

                      <div>
                        <Label htmlFor="instructions">Special Instructions</Label>
                        <Textarea
                          id="instructions"
                          rows={3}
                          placeholder="Any specific instructions..."
                          value={willData.instructions}
                          onChange={(e) => setWillData({ ...willData, instructions: e.target.value })}
                          data-testid="textarea-instructions"
                        />
                      </div>

                      <Button 
                        onClick={handleAddBeneficiary}
                        disabled={addBeneficiaryMutation.isPending}
                        className="w-full"
                        data-testid="button-add-beneficiary"
                      >
                        {addBeneficiaryMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Beneficiary
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Current Beneficiaries */}
              <Card data-testid="current-beneficiaries">
                <CardHeader>
                  <CardTitle>Current Beneficiaries</CardTitle>
                </CardHeader>
                <CardContent>
                  {digitalWill?.beneficiaries?.length > 0 ? (
                    <div className="space-y-4">
                      {digitalWill.beneficiaries.map((beneficiary: any, index: number) => (
                        <div key={beneficiary.id} className="p-4 bg-muted rounded-lg" data-testid={`beneficiary-${index}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{beneficiary.fullName}</h4>
                            <span className="text-sm text-muted-foreground capitalize">{beneficiary.relationship}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-primary">{beneficiary.percentage}%</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBeneficiary(beneficiary.id)}
                              disabled={deleteBeneficiaryMutation.isPending}
                              data-testid={`button-delete-beneficiary-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {beneficiary.instructions && (
                            <p className="text-sm text-muted-foreground mt-2">{beneficiary.instructions}</p>
                          )}
                        </div>
                      ))}

                      {/* Will Summary */}
                      <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Total Allocated:</span>
                          <span className="text-xl font-bold text-primary">{totalAllocation}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Will Status:</span>
                          <Badge variant={totalAllocation === 100 ? "default" : "secondary"}>
                            {totalAllocation === 100 ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Incomplete
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Beneficiaries Added</h4>
                      <p className="text-muted-foreground">
                        {digitalWill ? "Add beneficiaries to complete your digital will." : "Create a digital will first to add beneficiaries."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4 md:space-y-6" data-testid="transactions-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Account Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accountTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {accountTransactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`transaction-${transaction.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{transaction.description}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                            <span>{new Date(transaction.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'credit' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                          </span>
                          <p className="text-xs text-muted-foreground capitalize">{transaction.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No Transactions</h4>
                    <p className="text-muted-foreground">Your account transaction history will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 md:space-y-6" data-testid="notifications-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Your Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification: any) => (
                      <div key={notification.id} className="p-4 bg-muted rounded-lg" data-testid={`notification-${notification.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${notification.readAt ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                              <span className="font-medium">{notification.title}</span>
                              {notification.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                              <span>{new Date(notification.createdAt).toLocaleTimeString()}</span>
                              {notification.readAt && <span>Read</span>}
                            </div>
                          </div>
                          {!notification.readAt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await apiRequest("PATCH", `/api/notifications/${notification.id}/read`, {});
                                  queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                                  toast({
                                    title: "Notification marked as read",
                                    description: "The notification has been marked as read.",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to mark notification as read.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              data-testid={`button-mark-read-${notification.id}`}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No Notifications</h4>
                    <p className="text-muted-foreground">You'll receive notifications about your account activity here.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Tickets Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Your Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supportTickets.length > 0 ? (
                  <div className="space-y-3">
                    {supportTickets.map((ticket: any) => (
                      <div key={ticket.id} className="p-4 bg-muted rounded-lg" data-testid={`ticket-${ticket.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ticket.subject}</span>
                              <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'} className="text-xs">
                                {ticket.status}
                              </Badge>
                              {ticket.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                              {ticket.lastActivity && (
                                <span>Last Activity: {new Date(ticket.lastActivity).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/support/${ticket.id}`}
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No Support Tickets</h4>
                    <p className="text-muted-foreground mb-4">Need help? Create a support ticket to get assistance.</p>
                    <Button onClick={() => window.location.href = "/support"} data-testid="button-create-ticket">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Support Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-4 md:space-y-6" data-testid="claims-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Inheritance Claims & Ownership Requests</h3>
              <div className="flex gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {userClaims.length} Claims
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {ownershipRequests.length} Requests
                </Badge>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Button
                onClick={() => setActiveTab('inheritance')}
                variant="outline"
                className="p-6 h-auto flex-col"
                data-testid="button-manage-inheritance"
              >
                <Shield className="h-8 w-8 mb-2 text-primary" />
                <span className="font-semibold">Manage Digital Will</span>
                <span className="text-sm text-muted-foreground mt-1">Set up inheritance planning</span>
              </Button>
              
              <Button
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                variant="outline" 
                className="p-6 h-auto flex-col"
                data-testid="button-new-ownership-request"
              >
                <Edit className="h-8 w-8 mb-2 text-primary" />
                <span className="font-semibold">Request Ownership Change</span>
                <span className="text-sm text-muted-foreground mt-1">Transfer or update ownership</span>
              </Button>
            </div>

            {/* Inheritance Claims List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  My Inheritance Claims
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userClaims.length > 0 ? (
                  <div className="space-y-4">
                    {userClaims.map((claim: any) => (
                      <div 
                        key={claim.id} 
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        data-testid={`claim-${claim.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{claim.claimType.replace(/_/g, ' ').toUpperCase()}</h4>
                            <p className="text-sm text-muted-foreground">Claim #{claim.claimNumber}</p>
                          </div>
                          <Badge 
                            variant={
                              claim.status === 'approved' ? 'default' :
                              claim.status === 'rejected' ? 'destructive' :
                              claim.status === 'under_review' ? 'secondary' : 'outline'
                            }
                          >
                            {claim.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium">Filed Date</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(claim.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Consignment</p>
                            <p className="text-sm text-muted-foreground">{claim.consignmentNumber}</p>
                          </div>
                        </div>

                        {claim.claimReason && (
                          <div className="mb-3">
                            <p className="text-sm font-medium">Reason</p>
                            <p className="text-sm text-muted-foreground">{claim.claimReason}</p>
                          </div>
                        )}

                        {(claim.status === 'pending_response' || claim.status === 'under_review') && (
                          <div className="flex items-center space-x-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedClaim(claim)}
                              data-testid={`respond-claim-${claim.id}`}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Respond
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Claims Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't filed any inheritance claims yet.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('inheritance')}
                      variant="outline"
                      data-testid="button-setup-will"
                    >
                      Set Up Digital Will
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ownership Change Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Ownership Change Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ownershipRequests.length > 0 ? (
                  <div className="space-y-4">
                    {ownershipRequests.map((request: any) => (
                      <div 
                        key={request.id} 
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        data-testid={`ownership-request-${request.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{request.requestedAction.replace(/_/g, ' ').toUpperCase()}</h4>
                            <p className="text-sm text-muted-foreground">Request #{request.requestNumber}</p>
                          </div>
                          <Badge 
                            variant={
                              request.status === 'approved' ? 'default' :
                              request.status === 'rejected' ? 'destructive' :
                              request.status === 'under_review' ? 'secondary' : 'outline'
                            }
                          >
                            {request.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium">Filed Date</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Consignment</p>
                            <p className="text-sm text-muted-foreground">{request.consignmentNumber}</p>
                          </div>
                        </div>

                        {request.newOwnerName && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium">New Owner</p>
                              <p className="text-sm text-muted-foreground">{request.newOwnerName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">New Owner Email</p>
                              <p className="text-sm text-muted-foreground">{request.newOwnerEmail}</p>
                            </div>
                          </div>
                        )}

                        {request.claimReason && (
                          <div className="mb-3">
                            <p className="text-sm font-medium">Reason</p>
                            <p className="text-sm text-muted-foreground">{request.claimReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Edit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Ownership Requests</h3>
                    <p className="text-muted-foreground">
                      You haven't submitted any ownership change requests yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Action - New Ownership Change Request */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Request Ownership Change
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consignment-select">Select Consignment</Label>
                    <Select 
                      value={ownershipRequest.consignmentId} 
                      onValueChange={(value) => setOwnershipRequest({...ownershipRequest, consignmentId: value})}
                    >
                      <SelectTrigger data-testid="select-consignment">
                        <SelectValue placeholder="Choose consignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {consignments.map((consignment: any) => (
                          <SelectItem key={consignment.id} value={consignment.id}>
                            {consignment.consignmentNumber} - {consignment.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="action-select">Requested Action</Label>
                    <Select 
                      value={ownershipRequest.requestedAction} 
                      onValueChange={(value) => setOwnershipRequest({...ownershipRequest, requestedAction: value})}
                    >
                      <SelectTrigger data-testid="select-action">
                        <SelectValue placeholder="Choose action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="change_beneficiary">Change Beneficiary</SelectItem>
                        <SelectItem value="update_details">Update Details</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-owner-name">New Owner Name</Label>
                    <Input
                      id="new-owner-name"
                      value={ownershipRequest.newOwnerName}
                      onChange={(e) => setOwnershipRequest({...ownershipRequest, newOwnerName: e.target.value})}
                      placeholder="Full name"
                      data-testid="input-new-owner-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-owner-email">New Owner Email</Label>
                    <Input
                      id="new-owner-email"
                      type="email"
                      value={ownershipRequest.newOwnerEmail}
                      onChange={(e) => setOwnershipRequest({...ownershipRequest, newOwnerEmail: e.target.value})}
                      placeholder="email@example.com"
                      data-testid="input-new-owner-email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-owner-phone">New Owner Phone</Label>
                    <Input
                      id="new-owner-phone"
                      value={ownershipRequest.newOwnerPhone}
                      onChange={(e) => setOwnershipRequest({...ownershipRequest, newOwnerPhone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                      data-testid="input-new-owner-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship to Current Owner</Label>
                  <Input
                    id="relationship"
                    value={ownershipRequest.relationship}
                    onChange={(e) => setOwnershipRequest({...ownershipRequest, relationship: e.target.value})}
                    placeholder="e.g., Spouse, Child, Beneficiary"
                    data-testid="input-relationship"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claim-reason">Reason for Change</Label>
                  <Textarea
                    id="claim-reason"
                    value={ownershipRequest.claimReason}
                    onChange={(e) => setOwnershipRequest({...ownershipRequest, claimReason: e.target.value})}
                    placeholder="Please explain the reason for this ownership change request..."
                    rows={3}
                    data-testid="textarea-claim-reason"
                  />
                </div>

                <Button
                  onClick={() => createOwnershipRequestMutation.mutate(ownershipRequest)}
                  disabled={createOwnershipRequestMutation.isPending || !ownershipRequest.consignmentId || !ownershipRequest.newOwnerName}
                  className="w-full"
                  data-testid="submit-ownership-request"
                >
                  {createOwnershipRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Claim Response Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Respond to Claim</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClaim(null)}
                  data-testid="close-claim-modal"
                >
                  ✕
                </Button>
              </div>
              
              <div className="mb-4">
                <p className="font-medium">{selectedClaim.claimType.replace(/_/g, ' ').toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">Claim #{selectedClaim.claimNumber}</p>
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="claim-response">Your Response</Label>
                <Textarea
                  id="claim-response"
                  value={claimResponse}
                  onChange={(e) => setClaimResponse(e.target.value)}
                  placeholder="Provide additional information or clarification for your claim..."
                  rows={4}
                  data-testid="textarea-claim-response"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedClaim(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => respondToClaimMutation.mutate({ claimId: selectedClaim.id, message: claimResponse })}
                  disabled={respondToClaimMutation.isPending || !claimResponse.trim()}
                  className="flex-1"
                  data-testid="send-claim-response"
                >
                  {respondToClaimMutation.isPending ? "Sending..." : "Send Response"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Response Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Respond to Notification</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNotification(null)}
                  data-testid="close-notification-modal"
                >
                  ✕
                </Button>
              </div>
              
              <div className="mb-4">
                <p className="font-medium">{selectedNotification.type.replace(/_/g, ' ').toUpperCase()}</p>
                <p className="text-sm text-muted-foreground mb-2">{selectedNotification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="notification-response">Your Response</Label>
                <Textarea
                  id="notification-response"
                  value={notificationResponse}
                  onChange={(e) => setNotificationResponse(e.target.value)}
                  placeholder="Provide your response or action on this notification..."
                  rows={4}
                  data-testid="textarea-notification-response"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => respondToNotificationMutation.mutate({ 
                    notificationId: selectedNotification.id, 
                    response: notificationResponse,
                    actionType: 'customer_response'
                  })}
                  disabled={respondToNotificationMutation.isPending || !notificationResponse.trim()}
                  className="flex-1"
                  data-testid="send-notification-response"
                >
                  {respondToNotificationMutation.isPending ? "Sending..." : "Send Response"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
