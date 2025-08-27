import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import AdminNavigation from "@/components/AdminNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Gavel, 
  Coins, 
  TrendingUp,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  BarChart3,
  Shield,
  Clock,
  User,
  Calendar
} from "lucide-react";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [claimNotes, setClaimNotes] = useState("");

  // Auth protection
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Admin data queries
  const { data: pendingClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/admin/pending-claims"],
    enabled: !!user,
  });

  const { data: consignments = [] } = useQuery({
    queryKey: ["/api/consignments"],
    enabled: !!user,
  });

  const { data: goldPrices } = useQuery({
    queryKey: ["/api/gold-prices"],
  });

  // Mutations
  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/claims/${id}/status`, { status, adminNotes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim Updated",
        description: "Claim status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-claims"] });
      setSelectedClaim(null);
      setClaimNotes("");
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
        title: "Failed to Update Claim",
        description: error.message || "An error occurred while updating the claim.",
        variant: "destructive",
      });
    },
  });

  const handleClaimAction = (status: string) => {
    if (!selectedClaim) return;
    
    updateClaimMutation.mutate({
      id: selectedClaim.id,
      status,
      adminNotes: claimNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate stats
  const totalConsignments = consignments.length;
  const totalGoldWeight = consignments.reduce((sum: number, c: any) => sum + parseFloat(c.weight || 0), 0);
  const totalPortfolioValue = consignments.reduce((sum: number, c: any) => sum + parseFloat(c.estimatedValue || 0), 0);
  const pendingClaimsCount = pendingClaims.length;

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation
        goldPrice={goldPrices?.usd || 2034.50}
        user={user}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-4">Admin Management Center</h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive administration tools for managing consignments, claims, and customer support
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8" data-testid="admin-tabs">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="consignments" data-testid="tab-consignments">Consignments</TabsTrigger>
            <TabsTrigger value="claims" data-testid="tab-claims">Claims</TabsTrigger>
            <TabsTrigger value="support" data-testid="tab-support">Support</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6" data-testid="overview-content">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card data-testid="stat-active-consignments">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Consignments</p>
                      <p className="text-2xl font-bold">{totalConsignments.toLocaleString()}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-pending-claims">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Claims</p>
                      <p className="text-2xl font-bold">{pendingClaimsCount}</p>
                    </div>
                    <Gavel className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-total-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Gold (oz)</p>
                      <p className="text-2xl font-bold">{totalGoldWeight.toFixed(1)}</p>
                    </div>
                    <Coins className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-portfolio-value">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <p className="text-2xl font-bold">
                        ${(totalPortfolioValue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card data-testid="recent-consignments">
                <CardHeader>
                  <CardTitle>Recent Consignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {consignments.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {consignments.slice(0, 5).map((consignment: any, index: number) => (
                        <div key={consignment.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`recent-consignment-${index}`}>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                              <Plus className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">#{consignment.consignmentNumber}</p>
                              <p className="text-sm text-muted-foreground">{consignment.weight} oz</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${parseFloat(consignment.estimatedValue).toLocaleString()}</p>
                            <Badge variant={consignment.status === 'stored' ? 'default' : 'secondary'}>
                              {consignment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent consignments</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="pending-actions">
                <CardHeader>
                  <CardTitle>Pending Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingClaims.length > 0 ? (
                      pendingClaims.slice(0, 3).map((claim: any, index: number) => (
                        <div key={claim.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-testid={`pending-action-${index}`}>
                          <div className="flex items-center">
                            <Gavel className="h-5 w-5 text-yellow-600 mr-3" />
                            <div>
                              <p className="font-medium">Inheritance Claim</p>
                              <p className="text-sm text-muted-foreground">From: {claim.claimantName}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedClaim(claim)}
                            data-testid={`button-review-claim-${index}`}
                          >
                            Review
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="text-muted-foreground">No pending actions</p>
                      </div>
                    )}

                    {/* Sample KYC Review Action */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid="pending-action-kyc">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium">KYC Review Required</p>
                          <p className="text-sm text-muted-foreground">Multiple customer documents</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" data-testid="button-review-kyc">
                        Review KYC
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Consignments Tab */}
          <TabsContent value="consignments" className="space-y-6" data-testid="consignments-content">
            <Card>
              <CardHeader>
                <CardTitle>All Consignments</CardTitle>
              </CardHeader>
              <CardContent>
                {consignments.length > 0 ? (
                  <div className="space-y-4">
                    {consignments.map((consignment: any) => (
                      <Card key={consignment.id} className="p-4" data-testid={`admin-consignment-${consignment.id}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">#{consignment.consignmentNumber}</h4>
                            <p className="text-sm text-muted-foreground">{consignment.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Weight: {consignment.weight} oz</span>
                              <span>Value: ${parseFloat(consignment.estimatedValue).toLocaleString()}</span>
                              <span>Plan: {consignment.storagePlan}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={consignment.status === 'stored' ? 'default' : 'secondary'} className="mb-2">
                              {consignment.status}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              {new Date(consignment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No consignments found</h4>
                    <p className="text-muted-foreground">
                      Consignments will appear here as customers create them.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6" data-testid="claims-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Claims List */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Inheritance Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  {claimsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading claims...</p>
                    </div>
                  ) : pendingClaims.length > 0 ? (
                    <div className="space-y-4">
                      {pendingClaims.map((claim: any) => (
                        <Card 
                          key={claim.id} 
                          className={`p-4 cursor-pointer transition-colors ${selectedClaim?.id === claim.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`}
                          onClick={() => setSelectedClaim(claim)}
                          data-testid={`claim-${claim.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{claim.claimantName}</h4>
                              <p className="text-sm text-muted-foreground">{claim.claimantEmail}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {new Date(claim.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {claim.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No pending claims</h4>
                      <p className="text-muted-foreground">
                        Inheritance claims will appear here for review.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Claim Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Claim Review</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedClaim ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Claimant Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span>{selectedClaim.claimantName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{selectedClaim.claimantEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Submitted:</span>
                            <span>{new Date(selectedClaim.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {selectedClaim.documentUrls?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Documents</h4>
                          <div className="space-y-2">
                            {selectedClaim.documentUrls.map((url: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">Document {index + 1}</span>
                                <Button variant="ghost" size="sm" className="ml-auto" data-testid={`button-view-doc-${index}`}>
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="adminNotes">Admin Notes</Label>
                        <Textarea
                          id="adminNotes"
                          value={claimNotes}
                          onChange={(e) => setClaimNotes(e.target.value)}
                          placeholder="Add notes about this claim review..."
                          rows={4}
                          data-testid="textarea-admin-notes"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleClaimAction('approved')}
                          disabled={updateClaimMutation.isPending}
                          className="flex-1"
                          data-testid="button-approve-claim"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleClaimAction('rejected')}
                          disabled={updateClaimMutation.isPending}
                          className="flex-1"
                          data-testid="button-reject-claim"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">Select a Claim</h4>
                      <p className="text-muted-foreground">
                        Choose a claim from the list to review details and take action.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6" data-testid="support-content">
            <Card>
              <CardHeader>
                <CardTitle>Customer Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Support Dashboard</h4>
                  <p className="text-muted-foreground mb-4">
                    Live chat support features will be implemented here.
                  </p>
                  <Button variant="outline" data-testid="button-manage-support">
                    Manage Support Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6" data-testid="analytics-content">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Analytics Dashboard</h4>
                  <p className="text-muted-foreground mb-4">
                    Comprehensive analytics and reporting features will be implemented here.
                  </p>
                  <Button variant="outline" data-testid="button-view-analytics">
                    View Full Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Claim Modal/Dialog would go here in a real implementation */}
      </div>

      <Footer />
    </div>
  );
}
