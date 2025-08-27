import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { 
  Search, 
  Package, 
  MapPin, 
  Clock, 
  Truck,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

interface TrackingUpdate {
  status: string;
  description: string;
  location: string;
  timestamp: string;
}

interface TrackingData {
  trackingId: string;
  status: string;
  location: string;
  updates: TrackingUpdate[];
}

export default function TrackingPortal() {
  const [trackingId, setTrackingId] = useState("");
  const [searchTrackingId, setSearchTrackingId] = useState("");
  const { toast } = useToast();

  const { data: trackingData, isLoading, error } = useQuery({
    queryKey: ["/api/tracking", searchTrackingId],
    queryFn: async () => {
      if (!searchTrackingId) return null;
      const response = await apiRequest("GET", `/api/tracking/${searchTrackingId}`, {});
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Tracking ID not found");
        }
        throw new Error("Failed to fetch tracking information");
      }
      return response.json();
    },
    enabled: !!searchTrackingId,
    retry: false,
  }) as { data: TrackingData | null, isLoading: boolean, error: Error | null };

  const handleSearch = () => {
    if (!trackingId.trim()) {
      toast({
        title: "Missing Tracking ID",
        description: "Please enter a tracking ID to search.",
        variant: "destructive",
      });
      return;
    }
    setSearchTrackingId(trackingId.trim());
  };

  const getStatusIcon = (status: string) => {
    const statusIcons = {
      received: <Package className="h-5 w-5 text-blue-500" />,
      in_vault: <Shield className="h-5 w-5 text-green-500" />,
      under_review: <AlertCircle className="h-5 w-5 text-orange-500" />,
      in_transit: <Truck className="h-5 w-5 text-blue-500" />,
      delivered: <CheckCircle className="h-5 w-5 text-green-500" />,
      rejected: <XCircle className="h-5 w-5 text-red-500" />
    };
    return statusIcons[status as keyof typeof statusIcons] || <Package className="h-5 w-5 text-gray-500" />;
  };

  const getStatusEmoji = (status: string) => {
    const statusEmojis = {
      received: '📦',
      in_vault: '🏦',
      under_review: '🔍',
      in_transit: '🚚',
      delivered: '✅',
      rejected: '❌'
    };
    return statusEmojis[status as keyof typeof statusEmojis] || '📋';
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      received: 'bg-blue-100 text-blue-800 border-blue-200',
      in_vault: 'bg-green-100 text-green-800 border-green-200',
      under_review: 'bg-orange-100 text-orange-800 border-orange-200',
      in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-serif font-bold mb-2">Track Your Consignment</h1>
          <p className="text-lg opacity-90">
            Enter your tracking ID to see the current status and location of your precious metals
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Enter Tracking ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="trackingId" className="sr-only">Tracking ID</Label>
                <Input
                  id="trackingId"
                  placeholder="Enter your tracking ID (e.g., TR123456789)"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                className="px-8"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-800">Tracking ID Not Found</h4>
                  <p className="text-red-600">
                    {error.message}. Please check your tracking ID and try again.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getStatusIcon(trackingData.status)}
                  <span className="ml-2">Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">
                      {getStatusEmoji(trackingData.status)}
                    </div>
                    <div>
                      <Badge className={getStatusColor(trackingData.status)}>
                        {trackingData.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tracking ID: {trackingData.trackingId}
                      </p>
                      {trackingData.location && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {trackingData.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Tracking History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingData.updates.length > 0 ? (
                    trackingData.updates.map((update, index) => (
                      <div key={index} className="flex items-start space-x-4 pb-4 last:pb-0">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(update.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className={getStatusColor(update.status)}>
                              {update.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(update.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{update.description}</p>
                          {update.location && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {update.location}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No tracking updates available yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Information */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Package className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">About Your Consignment Tracking</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Your precious metals are being tracked throughout their journey with us. 
                      Updates are provided in real-time as your items move through our secure 
                      verification, storage, and delivery processes. For any questions about 
                      your consignment, please contact our support team.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Initial State */}
        {!searchTrackingId && !error && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Track</h3>
                <p className="text-muted-foreground mb-6">
                  Enter your tracking ID above to see the current status and history of your consignment.
                </p>
                <div className="bg-muted p-4 rounded-lg text-sm text-left max-w-md mx-auto">
                  <h4 className="font-medium mb-2">Tracking ID Format:</h4>
                  <p className="text-muted-foreground">
                    Your tracking ID typically starts with "TR" followed by numbers (e.g., TR123456789).
                    You can find this ID in your consignment confirmation email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}