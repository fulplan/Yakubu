import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  Wallet
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Will Builder State
  const [willData, setWillData] = useState({
    primaryBeneficiary: "",
    relationship: "",
    allocation: 50,
    instructions: "",
  });

  // Auth protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

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

  // Mutations
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
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
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
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
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
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        goldPrice={currentGoldPrice}
        onLogin={() => window.location.href = "/api/login"}
        onRegister={() => window.location.href = "/api/login"}
        user={user}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-4">Portfolio Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Manage your gold investments, certificates, and inheritance planning
          </p>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-8" data-testid="dashboard-tabs">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="portfolio" data-testid="tab-portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="consignments" data-testid="tab-consignments">Consignments</TabsTrigger>
            <TabsTrigger value="certificates" data-testid="tab-certificates">Certificates</TabsTrigger>
            <TabsTrigger value="inheritance" data-testid="tab-inheritance">Inheritance</TabsTrigger>
            <TabsTrigger value="tracking" data-testid="tab-tracking">Tracking</TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6" data-testid="portfolio-content">
            {/* Live Gold Price Market Overview */}
            <Card data-testid="live-gold-prices">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coins className="h-5 w-5 mr-2 text-primary" />
                  Live Gold Prices (LBMA/COMEX)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">USD per oz</p>
                      <p className="text-2xl font-bold">${currentGoldPrice.toFixed(2)}</p>
                      <p className={`text-sm ${goldPrices?.change24h?.usd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {goldPrices?.change24h?.usd >= 0 ? '+' : ''}{goldPrices?.change24h?.usd?.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      Last updated: {goldPrices?.lastUpdated ? new Date(goldPrices.lastUpdated).toLocaleTimeString() : 'Now'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">GBP per oz</p>
                      <p className="text-2xl font-bold">£{goldPrices?.gbp?.toFixed(2) || '1,628.00'}</p>
                      <p className={`text-sm ${goldPrices?.change24h?.gbp >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {goldPrices?.change24h?.gbp >= 0 ? '+' : ''}{goldPrices?.change24h?.gbp?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">EUR per oz</p>
                      <p className="text-2xl font-bold">€{goldPrices?.eur?.toFixed(2) || '1,885.00'}</p>
                      <p className={`text-sm ${goldPrices?.change24h?.eur >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {goldPrices?.change24h?.eur >= 0 ? '+' : ''}{goldPrices?.change24h?.eur?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Balance */}
            <Card data-testid="account-balance">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="h-5 w-5 mr-2 text-primary" />
                  Account Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-primary">
                    ${accountBalance.balance ? accountBalance.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Available funds</p>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            {/* Real-time Portfolio Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <TabsContent value="consignments" className="space-y-6" data-testid="consignments-content">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Gold Consignments</CardTitle>
                <Button onClick={() => window.location.href = "/consignment"} data-testid="button-new-consignment">
                  <Plus className="h-4 w-4 mr-2" />
                  New Consignment
                </Button>
              </CardHeader>
              <CardContent>
                {consignments.length > 0 ? (
                  <div className="space-y-4">
                    {consignments.map((consignment: any) => (
                      <Card key={consignment.id} className="p-4" data-testid={`consignment-${consignment.id}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">#{consignment.consignmentNumber}</h4>
                            <p className="text-sm text-muted-foreground">{consignment.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Weight: {consignment.weight} oz</span>
                              <span>Purity: {consignment.purity}%</span>
                              <span>Value: ${parseFloat(consignment.estimatedValue).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={consignment.status === 'stored' ? 'default' : 'secondary'} className="mb-2">
                              {consignment.status}
                            </Badge>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/tracking/${consignment.consignmentNumber}`}
                                data-testid={`button-track-${consignment.id}`}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Track
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No consignments yet</h4>
                    <p className="text-muted-foreground mb-4">
                      Create your first consignment to start storing gold securely.
                    </p>
                    <Button onClick={() => window.location.href = "/consignment"} data-testid="button-create-first">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Consignment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6" data-testid="certificates-content">
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
          <TabsContent value="tracking" className="space-y-6" data-testid="tracking-content">
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
          <TabsContent value="inheritance" className="space-y-6" data-testid="inheritance-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
