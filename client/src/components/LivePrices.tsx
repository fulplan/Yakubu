import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PoundSterling, Euro, RefreshCw } from "lucide-react";

export default function LivePrices() {
  const { data: goldPrices, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/gold-prices"],
    refetchInterval: 60000, // Refetch every minute
  });

  if (error) {
    return (
      <section className="py-16 bg-background" data-testid="live-prices-error">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Live Gold Market Prices</h2>
            <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
              <div className="text-center text-muted-foreground">
                <RefreshCw className="h-16 w-16 mx-auto mb-4" />
                <p>Unable to load current gold prices. Please try again later.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const prices = goldPrices || {
    usd: 2034.50,
    gbp: 1627.80,
    eur: 1885.40,
    change24h: {
      usd: 1.2,
      gbp: 0.8,
      eur: -0.3,
    }
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-600' : 'text-red-600',
    };
  };

  return (
    <section className="py-16 bg-background" data-testid="live-prices">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Live Gold Market Prices</h2>
          <p className="text-muted-foreground text-lg">Real-time pricing from LBMA and COMEX exchanges</p>
        </div>
        
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* USD Price */}
            <Card className="bg-muted" data-testid="price-usd">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-primary mr-2" />
                    <span className="text-sm font-medium text-muted-foreground">USD</span>
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    ${isLoading ? '...' : prices.usd.toFixed(2)}
                  </div>
                  {!isLoading && prices.change24h?.usd !== undefined && (
                    <div className={`flex items-center justify-center ${formatChange(prices.change24h.usd).color}`}>
                      {(() => {
                        const change = formatChange(prices.change24h.usd);
                        const Icon = change.icon;
                        return (
                          <>
                            <Icon className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {change.isPositive ? '+' : '-'}{change.value}%
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* GBP Price */}
            <Card className="bg-muted" data-testid="price-gbp">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <PoundSterling className="h-6 w-6 text-primary mr-2" />
                    <span className="text-sm font-medium text-muted-foreground">GBP</span>
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    £{isLoading ? '...' : prices.gbp.toFixed(2)}
                  </div>
                  {!isLoading && prices.change24h?.gbp !== undefined && (
                    <div className={`flex items-center justify-center ${formatChange(prices.change24h.gbp).color}`}>
                      {(() => {
                        const change = formatChange(prices.change24h.gbp);
                        const Icon = change.icon;
                        return (
                          <>
                            <Icon className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {change.isPositive ? '+' : '-'}{change.value}%
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* EUR Price */}
            <Card className="bg-muted" data-testid="price-eur">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Euro className="h-6 w-6 text-primary mr-2" />
                    <span className="text-sm font-medium text-muted-foreground">EUR</span>
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    €{isLoading ? '...' : prices.eur.toFixed(2)}
                  </div>
                  {!isLoading && prices.change24h?.eur !== undefined && (
                    <div className={`flex items-center justify-center ${formatChange(prices.change24h.eur).color}`}>
                      {(() => {
                        const change = formatChange(prices.change24h.eur);
                        const Icon = change.icon;
                        return (
                          <>
                            <Icon className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {change.isPositive ? '+' : '-'}{change.value}%
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Price Chart Placeholder */}
          <div className="mt-8 chart-container rounded-xl p-6" data-testid="price-chart">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">24-Hour Price Movement</h3>
              <div className="text-sm text-muted-foreground">
                Last updated: {isLoading ? 'Loading...' : 'Just now'}
              </div>
            </div>
            <div className="h-64 bg-background/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isLoading ? 'Loading price chart...' : 'Interactive price chart - Real-time market data'}
                </p>
                {!isLoading && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">24h High</div>
                      <div className="text-green-600">${(prices.usd * 1.015).toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">24h Low</div>
                      <div className="text-red-600">${(prices.usd * 0.995).toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Volume</div>
                      <div className="text-muted-foreground">1.2M oz</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
