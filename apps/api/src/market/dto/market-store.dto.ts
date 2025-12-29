import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MarketStore {
  name: string;
  category: string;
  subcategory?: string;
}

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

export class MarketStoreListDto {
  areaName: string;

  reviewSummary: {
    naver: string;
  };

  stores: MarketStore[];
}
