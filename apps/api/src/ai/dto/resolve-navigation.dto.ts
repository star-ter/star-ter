import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ResolveNavigationDto {
  @IsString()
  place_query: string;

  @IsNumber()
  @IsOptional()
  current_zoom?: number;
}
