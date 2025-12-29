import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const revenueLevels = ['city', 'gu', 'dong', 'backarea', 'commercial'] as const;
export type RevenueLevel = (typeof revenueLevels)[number];

export class RevenueItemDto {
  industryCode: string;
  industryName: string;
  amount: number;
  count: number;
}

export class RevenueResponseDto {
  level: RevenueLevel;
  code: string;
  quarter: string;
  totalAmount: number;
  totalCount: number;
  items: RevenueItemDto[];
}

export class RevenueRankingItemDto {
  code: string;
  name: string;
  amount: number;
  count: number;
}

export class RevenueRankingResponseDto {
  level: RevenueLevel;
  quarter: string;
  industryCode?: string;
  items: RevenueRankingItemDto[];
}

export class GetRevenueQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(revenueLevels)
  level: RevenueLevel;

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

export class GetRevenueRankingQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(revenueLevels)
  level: RevenueLevel;

  @IsString()
  @IsOptional()
  industryCode?: string;

  @IsString()
  @IsOptional()
  quarter?: string;
}
