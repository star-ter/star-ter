import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetMarketAnalysisQueryDto {
  @IsString()
  @IsNotEmpty()
  latitude: string;

  @IsString()
  @IsNotEmpty()
  longitude: string;

  @IsString()
  @IsOptional()
  polygon?: string;
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
