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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lock, University, Award, CheckCircle, Plus, Save, Search, QrCode, Download, Edit, Trash2, Gavel, TriangleAlert, Scroll } from "lucide-react";

export default function Landing() {
  const [goldPrice, setGoldPrice] = useState(2034.50);
  const [trackingId, setTrackingId] = useState("");
  
  // Digital will state
  const [willData, setWillData] = useState({
    primaryBeneficiary: "",
    relationship: "",
    allocation: 50,
    instructions: "",
  });

  const [beneficiaries, setBeneficiaries] = useState([
    {
      name: "Sarah Johnson",
      relationship: "Daughter", 
      percentage: 60,
      instructions: "To be held in trust until age 25, with annual distributions for education expenses."
    },
    {
      name: "Michael Johnson",
      relationship: "Son",
      percentage: 40, 
      instructions: "Equal distribution with sister, available at age 21."
    }
  ]);

  const totalAllocation = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);

  const handleStartConsignment = () => {
    window.location.href = "/api/login";
  };

  const handleGetStarted = () => {
    window.location.href = "/api/login";
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
        onLogin={() => window.location.href = "/api/login"}
        onRegister={() => window.location.href = "/api/login"}
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

      {/* User Dashboard Preview */}
      <section className="py-20 bg-muted" data-testid="dashboard-preview">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Your Gold Portfolio Dashboard</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Monitor your gold investments, track storage, and manage your digital assets from one secure platform
            </p>
          </div>
          
          <Card className="overflow-hidden" data-testid="dashboard-demo">
            <div className="bg-primary text-primary-foreground p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Welcome back, John Smith</h3>
                  <p className="text-primary-foreground/80">Portfolio Overview</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">$127,450</div>
                  <div className="text-sm text-primary-foreground/80">Total Portfolio Value</div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <span className="text-2xl text-primary mr-3">🪙</span>
                    Gold Holdings
                  </h4>
                  <div className="text-2xl font-bold mb-2">62.5 oz</div>
                  <div className="text-sm text-muted-foreground">Current Weight</div>
                </Card>
                
                <Card className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <span className="text-2xl text-primary mr-3">📈</span>
                    Performance
                  </h4>
                  <div className="text-2xl font-bold mb-2 text-green-600">+12.8%</div>
                  <div className="text-sm text-muted-foreground">This Year</div>
                </Card>
                
                <Card className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <span className="text-2xl text-primary mr-3">📅</span>
                    Storage
                  </h4>
                  <div className="text-2xl font-bold mb-2">287 days</div>
                  <div className="text-sm text-muted-foreground">Until Renewal</div>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="flex items-center justify-center" onClick={handleGetStarted} data-testid="button-add-gold">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gold
                </Button>
                <Button variant="outline" className="flex items-center justify-center" onClick={handleGetStarted} data-testid="button-view-certificates">
                  <Award className="h-4 w-4 mr-2" />
                  View Certificates
                </Button>
                <Button variant="outline" className="flex items-center justify-center" onClick={handleGetStarted} data-testid="button-manage-will">
                  <Scroll className="h-4 w-4 mr-2" />
                  Manage Will
                </Button>
              </div>
            </div>
          </Card>
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

      {/* Digital Will Interface */}
      <section className="py-20 bg-muted" data-testid="digital-will-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Digital Inheritance Planning</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Secure your family's future with our comprehensive digital will and inheritance management system
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Will Builder */}
            <Card className="p-8" data-testid="will-builder">
              <h3 className="text-2xl font-bold mb-6">Digital Will Builder</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Beneficiary</label>
                  <Input
                    type="text"
                    placeholder="Full legal name"
                    value={willData.primaryBeneficiary}
                    onChange={(e) => setWillData({ ...willData, primaryBeneficiary: e.target.value })}
                    data-testid="input-beneficiary-name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Relationship</label>
                  <Select value={willData.relationship} onValueChange={(value) => setWillData({ ...willData, relationship: value })}>
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
                  <label className="block text-sm font-medium mb-2">Gold Allocation (%)</label>
                  <Input
                    type="number"
                    placeholder="50"
                    min="1"
                    max="100"
                    value={willData.allocation}
                    onChange={(e) => setWillData({ ...willData, allocation: parseInt(e.target.value) || 0 })}
                    data-testid="input-allocation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Special Instructions</label>
                  <Textarea
                    rows={4}
                    placeholder="Any specific instructions for this inheritance..."
                    value={willData.instructions}
                    onChange={(e) => setWillData({ ...willData, instructions: e.target.value })}
                    className="resize-none"
                    data-testid="textarea-instructions"
                  />
                </div>
                
                <Button variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={handleGetStarted} data-testid="button-add-beneficiary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Beneficiary
                </Button>
              </div>
            </Card>
            
            {/* Current Beneficiaries */}
            <Card className="p-8" data-testid="current-beneficiaries">
              <h3 className="text-2xl font-bold mb-6">Current Beneficiaries</h3>
              
              <div className="space-y-4">
                {beneficiaries.map((beneficiary, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg" data-testid={`beneficiary-${index}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{beneficiary.name}</h4>
                      <span className="text-sm text-muted-foreground">{beneficiary.relationship}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{beneficiary.percentage}%</span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={handleGetStarted} data-testid={`button-edit-beneficiary-${index}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleGetStarted} data-testid={`button-delete-beneficiary-${index}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{beneficiary.instructions}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Total Allocated:</span>
                  <span className="text-xl font-bold text-primary">{totalAllocation}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Will Status:</span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Complete</span>
                </div>
              </div>
              
              <Button className="w-full mt-6" onClick={handleGetStarted} data-testid="button-save-will">
                <Save className="h-4 w-4 mr-2" />
                Save Digital Will
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Admin Dashboard Preview */}
      <section className="py-20 bg-background" data-testid="admin-dashboard-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Admin Management Center</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive administration tools for managing consignments, claims, and customer support
            </p>
          </div>
          
          <Card className="mb-8" data-testid="admin-dashboard-preview">
            <div className="flex flex-wrap border-b border-border">
              <Button variant="ghost" className="px-6 py-4 font-medium text-primary border-b-2 border-primary" data-testid="tab-overview">
                Overview
              </Button>
              <Button variant="ghost" className="px-6 py-4 font-medium text-muted-foreground hover:text-foreground" data-testid="tab-consignments">
                Consignments
              </Button>
              <Button variant="ghost" className="px-6 py-4 font-medium text-muted-foreground hover:text-foreground" data-testid="tab-claims">
                Claims
              </Button>
              <Button variant="ghost" className="px-6 py-4 font-medium text-muted-foreground hover:text-foreground" data-testid="tab-support">
                Support
              </Button>
              <Button variant="ghost" className="px-6 py-4 font-medium text-muted-foreground hover:text-foreground" data-testid="tab-analytics">
                Analytics
              </Button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6" data-testid="stat-active-consignments">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Consignments</p>
                      <p className="text-2xl font-bold">1,247</p>
                    </div>
                    <span className="text-2xl text-primary">📦</span>
                  </div>
                </Card>
                
                <Card className="p-6" data-testid="stat-pending-claims">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Claims</p>
                      <p className="text-2xl font-bold">23</p>
                    </div>
                    <Gavel className="h-8 w-8 text-primary" />
                  </div>
                </Card>
                
                <Card className="p-6" data-testid="stat-total-gold">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Gold (oz)</p>
                      <p className="text-2xl font-bold">15,382</p>
                    </div>
                    <span className="text-2xl text-primary">🪙</span>
                  </div>
                </Card>
                
                <Card className="p-6" data-testid="stat-portfolio-value">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <p className="text-2xl font-bold">$31.3M</p>
                    </div>
                    <span className="text-2xl text-primary">📈</span>
                  </div>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Recent Consignments</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid="recent-consignment-1">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                          <Plus className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">GV-2024-001250</p>
                          <p className="text-sm text-muted-foreground">5.2 oz Gold Bars</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">$10,580</p>
                        <p className="text-sm text-green-600">Verified</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Pending Actions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-testid="pending-action-kyc">
                      <div className="flex items-center">
                        <TriangleAlert className="h-5 w-5 text-yellow-600 mr-3" />
                        <div>
                          <p className="font-medium">KYC Review Required</p>
                          <p className="text-sm text-muted-foreground">Customer ID: CU-2024-4821</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={handleGetStarted} data-testid="button-review-kyc">
                        Review
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid="pending-action-claim">
                      <div className="flex items-center">
                        <Scroll className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium">Inheritance Claim</p>
                          <p className="text-sm text-muted-foreground">Claim ID: CL-2024-0089</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={handleGetStarted} data-testid="button-review-claim">
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
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
