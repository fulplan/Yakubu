import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, QrCode, Download, CheckCircle, Shield, Award, AlertCircle, ArrowLeft, Home, Package, FileText, ExternalLink, Clock, MapPin } from "lucide-react";

export default function Tracking() {
  const [match, params] = useRoute("/tracking/:consignmentNumber?");
  const [trackingId, setTrackingId] = useState("");
  const [searchedId, setSearchedId] = useState("");
  
  // Set the initial tracking ID from URL params
  useEffect(() => {
    if (params?.consignmentNumber) {
      setTrackingId(params.consignmentNumber);
      setSearchedId(params.consignmentNumber);
    }
  }, [params?.consignmentNumber]);

  const { data: trackingData, isLoading, error } = useQuery({
    queryKey: ["/api/tracking", searchedId],
    enabled: !!searchedId,
    retry: false,
  }) as { data: any, isLoading: boolean, error: any };

  const handleSearch = () => {
    if (trackingId.trim()) {
      setSearchedId(trackingId.trim());
    }
  };

  const handleScanQR = () => {
    // In a real app, this would open QR scanner
    alert("QR Scanner would open here");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'stored':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'stored':
        return <CheckCircle className="h-4 w-4" />;
      case 'verified':
        return <Shield className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Mobile Top Navigation Component
  const MobileTopNav = () => (
    <div className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-40 md:hidden">
      <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/dashboard"}
            className="p-1 h-8 w-8"
            data-testid="mobile-back"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-primary mr-2" />
            <div>
              <span className="text-base font-serif font-bold text-primary">GoldVault</span>
              <p className="text-xs text-muted-foreground leading-none">Track Consignment</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-muted-foreground truncate max-w-[80px]">
            Guest
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation 
          goldPrice={2034.50}
          onLogin={() => window.location.href = "/api/login"}
          onRegister={() => window.location.href = "/api/login"}
        />
      </div>

      {/* Mobile Top Navigation */}
      <MobileTopNav />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-3 md:py-8" data-testid="tracking-page">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold mb-3 md:mb-6">Track Your Consignment</h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            Enter your consignment ID or scan the QR code to view real-time status and audit trail
          </p>
        </div>

        {/* Search Box */}
        <Card className="mb-4 md:mb-8" data-testid="tracking-search">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                placeholder="Enter Consignment ID (e.g., GV-2024-001234)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="flex-1"
                data-testid="input-tracking-id"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                className="whitespace-nowrap"
                disabled={!trackingId.trim() || isLoading}
                data-testid="button-track"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track Now
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={handleScanQR}
                className="text-primary hover:text-primary/80 text-sm"
                data-testid="button-scan-qr"
              >
                <QrCode className="h-4 w-4 mr-1" />
                Or scan QR code from certificate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {error && (
          <Card className="mb-8" data-testid="tracking-error">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Consignment Not Found</h3>
              <p className="text-muted-foreground">
                Please check your consignment ID and try again. Make sure to include the full ID (e.g., GV-2024-001234).
              </p>
            </CardContent>
          </Card>
        )}

        {trackingData && trackingData.consignment && (
          <Card className="mb-8" data-testid="tracking-results">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    Consignment #{trackingData.consignment.consignmentNumber}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {trackingData.consignment.description || 'Gold Storage Consignment'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Weight: {trackingData.consignment.weight} oz</span>
                    <span>•</span>
                    <span>Created: {new Date(trackingData.consignment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <Badge 
                    className={`${getStatusColor(trackingData.consignment.status)} mb-2 text-lg px-4 py-2`}
                    data-testid="status-badge"
                  >
                    {getStatusIcon(trackingData.consignment.status)}
                    <span className="ml-2 capitalize font-semibold">{trackingData.consignment.status}</span>
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    Last Updated: {trackingData.events && trackingData.events.length > 0 
                      ? new Date(trackingData.events[0].timestamp).toLocaleString()
                      : 'Recently'
                    }
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
                <div className="space-y-4" data-testid="audit-trail">
                  {trackingData.events && trackingData.events.length > 0 ? trackingData.events
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((event: any, index: number) => (
                    <div key={event.id} className="flex items-start" data-testid={`event-${index}`}>
                      <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        {event.eventType === 'created' && <Package className="h-5 w-5 text-primary-foreground" />}
                        {event.eventType === 'verified' && <Shield className="h-5 w-5 text-primary-foreground" />}
                        {event.eventType === 'stored' && <Award className="h-5 w-5 text-primary-foreground" />}
                        {event.eventType === 'status_changed' && <AlertCircle className="h-5 w-5 text-primary-foreground" />}
                        {!['created', 'verified', 'stored', 'status_changed'].includes(event.eventType) && <Clock className="h-5 w-5 text-primary-foreground" />}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{event.description}</h4>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="text-muted-foreground text-sm mt-1">
                            {event.metadata.verifiedWeight && (
                              <span>Verified Weight: {event.metadata.verifiedWeight}oz </span>
                            )}
                            {event.metadata.verifiedPurity && (
                              <span>Purity: {event.metadata.verifiedPurity}% </span>
                            )}
                            {event.metadata.newStatus && (
                              <span>New Status: {event.metadata.newStatus} </span>
                            )}
                            {event.metadata.adminNotes && (
                              <div className="mt-1">Notes: {event.metadata.adminNotes}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No tracking events available yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Certificate Download */}
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Storage Certificate</h4>
                      <p className="text-sm text-muted-foreground">
                        PDF certificate with QR tracking code
                      </p>
                    </div>
                    <Button data-testid="button-download-certificate">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Sample tracking for demo when no specific ID is searched */}
        {!searchedId && (
          <Card className="mb-8" data-testid="tracking-demo">
            <CardHeader>
              <CardTitle>Try a Sample Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Want to see how tracking works? Try searching for our sample consignment:
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm">GV-2024-001234</code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setTrackingId("GV-2024-001234");
                    setSearchedId("GV-2024-001234");
                  }}
                  data-testid="button-try-sample"
                >
                  Try Sample
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 md:hidden shadow-lg">
        <div className="grid grid-cols-5 px-1 py-3 safe-area-inset-bottom">
          {[
            { id: 'portfolio', icon: Home, label: 'Portfolio', shortLabel: 'Home', href: '/dashboard' },
            { id: 'consignments', icon: Package, label: 'Consignments', shortLabel: 'Assets', href: '/dashboard?tab=consignments' },
            { id: 'certificates', icon: FileText, label: 'Certificates', shortLabel: 'Docs', href: '/dashboard?tab=certificates' },
            { id: 'inheritance', icon: Shield, label: 'Inheritance', shortLabel: 'Will', href: '/dashboard?tab=inheritance' },
            { id: 'tracking', icon: ExternalLink, label: 'Tracking', shortLabel: 'Track', href: '/dashboard?tab=tracking', active: true }
          ].map(({ id, icon: Icon, label, shortLabel, href, active }) => (
            <button
              key={id}
              onClick={() => window.location.href = href}
              className={`flex flex-col items-center justify-center py-2 px-1 min-h-[64px] transition-all duration-200 rounded-lg mx-1 ${
                active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              data-testid={`bottom-nav-${id}`}
              aria-label={label}
            >
              <Icon className={`h-6 w-6 mb-1 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium leading-tight text-center max-w-[60px] truncate">
                {shortLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
