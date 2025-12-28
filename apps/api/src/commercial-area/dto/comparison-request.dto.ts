import { IsString, IsOptional, Matches } from 'class-validator';

export class ComparisonRequestDto {
  @IsString()
  areaCode1: string;

  @IsString()
  areaCode2: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'yearMonth must be in YYYYMM format (e.g., 202412)',
  })
  yearMonth?: string; // YYYYMM format, optional
}
