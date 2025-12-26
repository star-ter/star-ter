export class GetMarketAnalysisQueryDto {
  latitude: string;
  longitude: string;
}

export class MarketAnalysisResponseDto {
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
  }[];
  openingRate: number;
  closureRate: number;
}
