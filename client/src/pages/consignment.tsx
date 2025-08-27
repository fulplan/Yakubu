import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Consignment() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    description: "",
    weight: "",
    purity: "",
    estimatedValue: "",
    storagePlan: "standard",
    insuranceEnabled: true,
  });

  const [files, setFiles] = useState<FileList | null>(null);

  const createConsignmentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/consignments", data);
      return response.json();
    },
    onSuccess: (consignment) => {
      toast({
        title: "Consignment Created Successfully",
        description: `Your consignment #${consignment.consignmentNumber} has been created and is pending verification.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      setLocation("/dashboard");
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
        title: "Failed to Create Consignment",
        description: error.message || "An error occurred while creating your consignment.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.weight || !formData.purity || !formData.estimatedValue) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const submitData = new FormData();
    submitData.append("description", formData.description);
    submitData.append("weight", formData.weight);
    submitData.append("purity", formData.purity);
    submitData.append("estimatedValue", formData.estimatedValue);
    submitData.append("storagePlan", formData.storagePlan);
    submitData.append("insuranceEnabled", formData.insuranceEnabled.toString());

    if (files) {
      Array.from(files).forEach((file) => {
        submitData.append("documents", file);
      });
    }

    createConsignmentMutation.mutate(submitData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by auth flow
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation 
          goldPrice={2034.50}
          onLogin={() => window.location.href = "/api/login"}
          onRegister={() => window.location.href = "/api/login"}
          user={user}
        />
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-3 md:py-8" data-testid="consignment-page">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/dashboard")}
            className="mb-2 md:mb-4 hidden md:flex"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          {/* Mobile header - compact */}
          <div className="md:hidden mb-4 pt-2">
            <h1 className="text-2xl font-serif font-bold mb-2">New Consignment</h1>
            <p className="text-sm text-muted-foreground">
              Create a secure gold consignment
            </p>
          </div>
          {/* Desktop header - full */}
          <div className="hidden md:block">
            <h1 className="text-4xl font-serif font-bold mb-4">Create Gold Consignment</h1>
            <p className="text-xl text-muted-foreground">
              Securely consign your gold assets with our professional storage service
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} data-testid="consignment-form">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Gold Details */}
              <Card data-testid="card-gold-details">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="text-2xl text-primary mr-2">🪙</span>
                    Gold Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="description">Item Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., 5 x 1oz Gold American Eagle Coins, 2024"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1"
                      required
                      data-testid="input-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (oz) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.0001"
                        placeholder="5.0000"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="mt-1"
                        required
                        data-testid="input-weight"
                      />
                    </div>

                    <div>
                      <Label htmlFor="purity">Purity (%) *</Label>
                      <Input
                        id="purity"
                        type="number"
                        step="0.001"
                        placeholder="99.9"
                        value={formData.purity}
                        onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                        className="mt-1"
                        required
                        data-testid="input-purity"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="estimatedValue">Estimated Value (USD) *</Label>
                    <Input
                      id="estimatedValue"
                      type="number"
                      step="0.01"
                      placeholder="10000.00"
                      value={formData.estimatedValue}
                      onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                      className="mt-1"
                      required
                      data-testid="input-estimated-value"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Storage Options */}
              <Card data-testid="card-storage-options">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-6 w-6 text-primary mr-2" />
                    Storage & Insurance Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Storage Plan</Label>
                    <Select 
                      value={formData.storagePlan} 
                      onValueChange={(value) => setFormData({ ...formData, storagePlan: value })}
                    >
                      <SelectTrigger className="mt-1" data-testid="select-storage-plan">
                        <SelectValue placeholder="Select storage plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (0.5% annually)</SelectItem>
                        <SelectItem value="premium">Premium (0.8% annually)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="insurance"
                      checked={formData.insuranceEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, insuranceEnabled: !!checked })}
                      data-testid="checkbox-insurance"
                    />
                    <Label htmlFor="insurance" className="text-sm">
                      Enable full value insurance (+0.1% annually)
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Document Upload */}
              <Card data-testid="card-document-upload">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-6 w-6 text-primary mr-2" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="documents">Upload Photos & Certificates (Optional)</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop files here, or click to browse
                      </p>
                      <Input
                        id="documents"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setFiles(e.target.files)}
                        className="hidden"
                        data-testid="input-documents"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('documents')?.click()}
                        data-testid="button-browse-files"
                      >
                        Choose Files
                      </Button>
                    </div>
                    {files && files.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {files.length} file(s) selected
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4 md:space-y-6">
              {/* Cost Summary */}
              <Card data-testid="card-cost-summary">
                <CardHeader>
                  <CardTitle>Cost Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Storage Fee (Annual)</span>
                    <span data-testid="text-storage-fee">
                      ${formData.estimatedValue ? (parseFloat(formData.estimatedValue) * 0.005).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  
                  {formData.insuranceEnabled && (
                    <div className="flex justify-between">
                      <span>Insurance (Annual)</span>
                      <span data-testid="text-insurance-fee">
                        ${formData.estimatedValue ? (parseFloat(formData.estimatedValue) * 0.001).toFixed(2) : "0.00"}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Setup Fee</span>
                    <span>$25.00</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Annual Cost</span>
                    <span className="text-primary" data-testid="text-total-cost">
                      ${formData.estimatedValue ? (
                        parseFloat(formData.estimatedValue) * 0.005 + 
                        (formData.insuranceEnabled ? parseFloat(formData.estimatedValue) * 0.001 : 0) + 
                        25
                      ).toFixed(2) : "25.00"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card data-testid="card-security-features">
                <CardHeader>
                  <CardTitle>Security Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      24/7 vault monitoring
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      Individual allocation
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      Digital certificates
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      QR code tracking
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      Full insurance coverage
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={createConsignmentMutation.isPending}
                data-testid="button-submit-consignment"
              >
                {createConsignmentMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Consignment...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Create Secure Consignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
