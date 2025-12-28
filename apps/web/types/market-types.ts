export interface MarketStore {
  name: string;
  category: string;
  subcategory?: string;
}

export interface MarketAnalysisData {
  isCommercialZone: boolean;
  areaName: string;
  estimatedRevenue: number;
  salesDescription: string;

  reviewSummary: {
    naver: string;
  };
  stores: MarketStore[];
  openingRate: number;
  closureRate: number;
}
