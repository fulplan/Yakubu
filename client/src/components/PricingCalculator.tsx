import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, DollarSign, Info } from "lucide-react";

interface PricingCalculatorProps {
  onGetQuote: () => void;
}

export default function PricingCalculator({ onGetQuote }: PricingCalculatorProps) {
  const [goldValue, setGoldValue] = useState(50000);
  const [duration, setDuration] = useState(12);
  const [insurance, setInsurance] = useState(true);
  const [storagePlan, setStoragePlan] = useState("standard");

  const [costs, setCosts] = useState({
    storageFee: 0,
    insuranceFee: 0,
    setupFee: 25,
    totalCost: 0,
  });

  useEffect(() => {
    const baseRate = storagePlan === "standard" ? 0.005 : 0.008; // 0.5% or 0.8% annually
    const insuranceRate = 0.001; // 0.1% annually
    
    const storageFee = (goldValue * baseRate * duration) / 12;
    const insuranceFee = insurance ? (goldValue * insuranceRate * duration) / 12 : 0;
    const totalCost = storageFee + insuranceFee + costs.setupFee;

    setCosts({
      storageFee,
      insuranceFee,
      setupFee: 25,
      totalCost,
    });
  }, [goldValue, duration, insurance, storagePlan]);

  return (
    <section id="pricing" className="py-20 bg-background" data-testid="pricing-calculator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Storage Pricing Calculator</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transparent pricing based on value and storage duration. Calculate your costs instantly.
          </p>
        </div>
        
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 md:p-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <div data-testid="calculator-form">
              <h3 className="text-xl font-semibold mb-6">Calculate Your Storage Costs</h3>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="goldValue">Gold Value (USD)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="goldValue"
                      type="number"
                      className="pl-8"
                      placeholder="50,000"
                      value={goldValue}
                      onChange={(e) => setGoldValue(parseInt(e.target.value) || 0)}
                      min="1000"
                      step="1000"
                      data-testid="input-gold-value"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="duration">Storage Duration</Label>
                  <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                    <SelectTrigger className="mt-1" data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Insurance Coverage</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="insurance"
                      checked={insurance}
                      onCheckedChange={(checked) => setInsurance(!!checked)}
                      data-testid="checkbox-insurance"
                    />
                    <Label htmlFor="insurance" className="text-sm">
                      Full Value Insurance (+0.1% annually)
                    </Label>
                  </div>
                </div>
                
                <div>
                  <Label>Storage Plan</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center p-3 border border-border rounded-lg hover:bg-muted cursor-pointer">
                      <input 
                        type="radio" 
                        name="plan" 
                        value="standard" 
                        checked={storagePlan === "standard"}
                        onChange={(e) => setStoragePlan(e.target.value)}
                        className="mr-3 text-primary" 
                        data-testid="radio-standard"
                      />
                      <div>
                        <div className="font-medium">Standard</div>
                        <div className="text-sm text-muted-foreground">0.5% annually + insurance</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-border rounded-lg hover:bg-muted cursor-pointer">
                      <input 
                        type="radio" 
                        name="plan" 
                        value="premium" 
                        checked={storagePlan === "premium"}
                        onChange={(e) => setStoragePlan(e.target.value)}
                        className="mr-3 text-primary" 
                        data-testid="radio-premium"
                      />
                      <div>
                        <div className="font-medium">Premium</div>
                        <div className="text-sm text-muted-foreground">0.8% annually + premium insurance</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cost Breakdown */}
            <div className="bg-muted rounded-xl p-6" data-testid="cost-breakdown">
              <h3 className="text-xl font-semibold mb-6">Cost Breakdown</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Storage Fee ({duration} months)</span>
                  <span className="font-semibold" data-testid="cost-storage">
                    ${costs.storageFee.toFixed(2)}
                  </span>
                </div>
                
                {insurance && (
                  <div className="flex justify-between">
                    <span>Insurance ({duration} months)</span>
                    <span className="font-semibold" data-testid="cost-insurance">
                      ${costs.insuranceFee.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Setup Fee</span>
                  <span className="font-semibold">${costs.setupFee.toFixed(2)}</span>
                </div>
                
                <hr className="border-border" />
                
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total Cost</span>
                  <span className="font-bold text-primary" data-testid="cost-total">
                    ${costs.totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-primary/10 rounded-lg" data-testid="included-features">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-primary mr-2" />
                  <span className="font-medium">Includes:</span>
                </div>
                <ul className="text-sm space-y-1 ml-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    24/7 vault monitoring
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    Individual allocation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    Digital certificates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    Online tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    Free annual inspection
                  </li>
                </ul>
              </div>
              
              <Button 
                className="w-full mt-6" 
                onClick={onGetQuote}
                data-testid="button-get-quote"
              >
                Get Official Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
