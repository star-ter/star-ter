export interface MarketAnalysisData {
  isCommercialZone: boolean;
  areaName: string;
  estimatedRevenue: number;
  salesDescription: string;

  reviewSummary: {
    naver: string;
    google: string;
  };
  stores: {
    name: string;
    category: string;
    subcategory?: string;
  }[];
  openingRate: number;
  closureRate: number;
}
