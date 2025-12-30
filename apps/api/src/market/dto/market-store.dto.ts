import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MarketStore {
  name: string;
  category: string;
  subcategory?: string;
}

/**
 * Analytics API 레벨 타입
 * - gu: 행정구 단위 (줌 레벨 7 이상)
 * - dong: 행정동 단위 (줌 레벨 5-6)
 * - commercial: 상권 단위 (줌 레벨 2-4)
 */
export type AnalyticsLevel = 'gu' | 'dong' | 'commercial';

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

  /**
   * 조회할 레벨 (줌 레벨에 따라 프론트엔드에서 결정)
   * - 미지정 시 기본 동작: 상권 → 행정동 순서로 조회
   */
  @IsString()
  @IsOptional()
  level?: AnalyticsLevel;
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
