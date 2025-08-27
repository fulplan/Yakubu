interface GoldPrices {
  usd: number;
  gbp: number;
  eur: number;
  change24h: {
    usd: number;
    gbp: number;
    eur: number;
  };
  lastUpdated: Date;
}

class GoldPriceService {
  private cachedPrices: GoldPrices | null = null;
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getCurrentPrices(): Promise<GoldPrices> {
    // Check if we have cached data that's still fresh
    if (this.cachedPrices && this.lastFetch && 
        Date.now() - this.lastFetch.getTime() < this.CACHE_DURATION) {
      return this.cachedPrices;
    }

    try {
      // In a real implementation, you would call actual gold price APIs
      // For example: MetalsAPI, LBMA, or similar services
      const prices = await this.fetchFromAPI();
      
      this.cachedPrices = prices;
      this.lastFetch = new Date();
      
      return prices;
    } catch (error) {
      console.error('Failed to fetch gold prices:', error);
      
      // Return cached data if available, otherwise return default prices
      if (this.cachedPrices) {
        return this.cachedPrices;
      }
      
      // Fallback to default prices
      return this.getDefaultPrices();
    }
  }

  private async fetchFromAPI(): Promise<GoldPrices> {
    // This would typically call a real gold price API
    // Example APIs: MetalsAPI, CurrencyAPI, LBMA, etc.
    
    const API_KEY = process.env.METALS_API_KEY || process.env.GOLD_PRICE_API_KEY;
    
    if (API_KEY) {
      try {
        // Example implementation for MetalsAPI
        const response = await fetch(`https://api.metals.live/v1/spot/gold`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return this.transformAPIResponse(data);
        }
      } catch (error) {
        console.error('API request failed:', error);
      }
    }
    
    // Simulate realistic price movements around base prices
    const baseUSD = 2034.50;
    const variation = (Math.random() - 0.5) * 40; // ±$20 variation
    const usdPrice = baseUSD + variation;
    
    // Calculate other currencies with realistic exchange rates
    const gbpPrice = usdPrice * 0.8; // Approximate GBP rate
    const eurPrice = usdPrice * 0.92; // Approximate EUR rate
    
    // Simulate 24h changes
    const usdChange = (Math.random() - 0.5) * 4; // ±2% change
    const gbpChange = usdChange + (Math.random() - 0.5) * 0.5; // Slight variation
    const eurChange = usdChange + (Math.random() - 0.5) * 0.5; // Slight variation
    
    return {
      usd: parseFloat(usdPrice.toFixed(2)),
      gbp: parseFloat(gbpPrice.toFixed(2)),
      eur: parseFloat(eurPrice.toFixed(2)),
      change24h: {
        usd: parseFloat(usdChange.toFixed(2)),
        gbp: parseFloat(gbpChange.toFixed(2)),
        eur: parseFloat(eurChange.toFixed(2)),
      },
      lastUpdated: new Date(),
    };
  }

  private transformAPIResponse(data: any): GoldPrices {
    // Transform the API response to our standard format
    // This would depend on the specific API being used
    return {
      usd: data.price_usd || 2034.50,
      gbp: data.price_gbp || 1627.80,
      eur: data.price_eur || 1885.40,
      change24h: {
        usd: data.change_24h_usd || 1.2,
        gbp: data.change_24h_gbp || 0.8,
        eur: data.change_24h_eur || -0.3,
      },
      lastUpdated: new Date(),
    };
  }

  private getDefaultPrices(): GoldPrices {
    return {
      usd: 2034.50,
      gbp: 1627.80,
      eur: 1885.40,
      change24h: {
        usd: 1.2,
        gbp: 0.8,
        eur: -0.3,
      },
      lastUpdated: new Date(),
    };
  }

  // Method to get historical prices (for future implementation)
  async getHistoricalPrices(days: number): Promise<any[]> {
    // This would implement historical price fetching
    // For now, return empty array
    return [];
  }
}

export const goldPriceService = new GoldPriceService();
