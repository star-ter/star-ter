import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const storeLevels = [
  'city',
  'gu',
  'dong',
  'backarea',
  'commercial',
] as const;
export type StoreLevel = (typeof storeLevels)[number];

export class StoreStatsDto {
  industryCode: string;
  industryName: string;
  storeCount: number;
  similarStoreCount: number;
  franchiseStoreCount: number;
  openRate: number;
  openStoreCount: number;
  closeRate: number;
  closeStoreCount: number;
}

export class StoreResponseDto {
  level: StoreLevel;
  code: string;
  quarter: string;
  items: StoreStatsDto[];
}

export class GetStoreQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(storeLevels)
  level: StoreLevel;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  industryCode?: string;

  @IsString()
  @IsOptional()
  quarter?: string;
}
