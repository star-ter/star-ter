import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RecommendRequestDto {
  @IsString()
  @IsNotEmpty()
  age: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  operatingTime: string;

  @IsString()
  @IsNotEmpty()
  capital: string;

  @IsString()
  @IsOptional()
  industryCode?: string; // 업종 코드 (예: CS100010) - 선택사항
}
