import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import HeroCarousel from "@/components/HeroCarousel";
import LivePrices from "@/components/LivePrices";
import PricingCalculator from "@/components/PricingCalculator";
import ChatSupport from "@/components/ChatSupport";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Lock, University, Award, CheckCircle, Search, QrCode, Download } from "lucide-react";

export default function Landing() {
  const [goldPrice, setGoldPrice] = useState(2034.50);
  const [trackingId, setTrackingId] = useState("");

  const handleStartConsignment = () => {
    window.location.href = "/auth";
  };

  const handleGetStarted = () => {
    window.location.href = "/auth";
  };

  const handleTrackConsignment = () => {
    if (trackingId.trim()) {
      // This would normally navigate to tracking page with the ID
      console.log(`Tracking consignment: ${trackingId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation 
        goldPrice={goldPrice}
        onLogin={() => window.location.href = "/auth"}
        onRegister={() => window.location.href = "/auth"}
      />

      {/* Hero Carousel */}
      <HeroCarousel 
        onStartConsignment={handleStartConsignment}
        onViewPricing={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
      />

      {/* Trust Indicators */}
      <section className="py-12 bg-muted" data-testid="trust-indicators">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <Shield className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="font-semibold">LBMA Certified</p>
              <p className="text-sm text-muted-foreground">London Bullion Market</p>
            </div>
            <div className="text-center">
              <Lock className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="font-semibold">$100M Insured</p>
              <p className="text-sm text-muted-foreground">Lloyd's of London</p>
            </div>
            <div className="text-center">
              <University className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="font-semibold">Bank-Grade Security</p>
              <p className="text-sm text-muted-foreground">Tier 4 Data Center</p>
            </div>
            <div className="text-center">
              <Award className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="font-semibold">ISO 27001</p>
              <p className="text-sm text-muted-foreground">Information Security</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Gold Prices */}
      <LivePrices />

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Our Premium Services</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive gold storage, investment, and inheritance solutions designed for the discerning investor
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Gold Storage Service */}
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300" data-testid="service-storage">
              <div className="h-64 bg-gradient-to-br from-muted to-muted-foreground/10 relative">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
                <div className="absolute top-4 left-4">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold mb-4">Secure Gold Storage</h3>
                <p className="text-muted-foreground mb-6">
                  Professional-grade storage facilities with 24/7 monitoring, climate control, and comprehensive insurance coverage.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Bank-grade vault security
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Individual storage allocation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Digital certificates & QR tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Full insurance coverage
                  </li>
                </ul>
                <Button className="w-full" onClick={handleGetStarted} data-testid="button-learn-storage">
                  Learn More
                </Button>
              </div>
            </Card>

            {/* Gold Consignment Service */}
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300" data-testid="service-consignment">
              <div className="h-64 bg-gradient-to-br from-gold-200 to-gold-400 relative">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold mb-4">Gold Consignment</h3>
                <p className="text-muted-foreground mb-6">
                  Easy consignment process with professional valuation, documentation, and secure transfer to our facilities.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Professional gold appraisal
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Secure pickup & transport
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Digital documentation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Instant online tracking
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={handleStartConsignment} data-testid="button-start-consignment">
                  Start Consignment
                </Button>
              </div>
            </Card>

            {/* Inheritance Planning Service */}
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300" data-testid="service-inheritance">
              <div className="h-64 bg-gradient-to-br from-muted-foreground/20 to-muted relative">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold mb-4">Digital Inheritance</h3>
                <p className="text-muted-foreground mb-6">
                  Comprehensive digital will creation and inheritance planning for your gold assets with legal verification.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Digital will builder
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Heir verification process
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Legal documentation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-2" />
                    Claims processing
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={handleGetStarted} data-testid="button-plan-inheritance">
                  Plan Inheritance
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Calculator */}
      <PricingCalculator onGetQuote={handleGetStarted} />

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Ready to Secure Your Gold?</h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of investors who trust GoldVault Pro with their precious metals storage and inheritance planning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-3"
              onClick={handleGetStarted}
              data-testid="button-get-started-cta"
            >
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-view-pricing-cta"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Public Tracking System */}
      <section id="tracking" className="py-20 bg-background" data-testid="tracking-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Track Your Consignment</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Enter your consignment ID or scan the QR code to view real-time status and audit trail
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="p-8" data-testid="tracking-search">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  type="text"
                  placeholder="Enter Consignment ID (e.g., GV-2024-001234)"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="flex-1"
                  data-testid="input-tracking-id"
                />
                <Button onClick={handleTrackConsignment} className="whitespace-nowrap" data-testid="button-track-now">
                  <Search className="h-4 w-4 mr-2" />
                  Track Now
                </Button>
              </div>
              <div className="mt-4 text-center">
                <Button variant="link" className="text-primary hover:text-primary/80 text-sm" data-testid="button-scan-qr">
                  <QrCode className="h-4 w-4 mr-1" />
                  Or scan QR code from certificate
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Sample Tracking Results */}
          <Card className="p-8" data-testid="tracking-results">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">Consignment #GV-2024-001234</h3>
                <p className="text-muted-foreground">2.5 oz Gold American Eagle Coins</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Stored Securely
                </div>
                <div className="text-sm text-muted-foreground mt-1">Last updated: 2 hours ago</div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Items secured in Vault A-127</h4>
                    <span className="text-sm text-muted-foreground">Jan 15, 2024 - 2:30 PM</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Gold coins allocated to individual secure storage compartment with biometric access control
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Insurance coverage activated</h4>
                    <span className="text-sm text-muted-foreground">Jan 15, 2024 - 1:45 PM</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Full value insurance policy activated through Lloyd's of London - Policy #LL-2024-7891
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Digital certificate generated</h4>
                    <span className="text-sm text-muted-foreground">Jan 15, 2024 - 1:15 PM</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Blockchain-verified certificate with QR tracking code generated and emailed
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-muted rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Storage Certificate</h4>
                  <p className="text-sm text-muted-foreground">PDF certificate with QR tracking code</p>
                </div>
                <Button onClick={handleGetStarted} data-testid="button-download-certificate">
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>



      {/* Chat Support */}
      <ChatSupport />

      {/* Footer */}
      <Footer />
    </div>
  );
}
