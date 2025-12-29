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

export class GetBuildingStoreQueryDto {
  @IsString()
  @IsNotEmpty()
  minx: string;

  @IsString()
  @IsNotEmpty()
  miny: string;

  @IsString()
  @IsNotEmpty()
  maxx: string;

  @IsString()
  @IsNotEmpty()
  maxy: string;

  @IsOptional()
  categories?: string[] | string;
}

export class BuildingStoreCountDto {
  buildingId: string;
  lat: number;
  lng: number;
  count: number;
  name: string;
}
