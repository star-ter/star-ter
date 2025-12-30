import { IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';

export class GeoAreaItemDto {
  code: string;
  name: string;
}

export class GeoAreaListResponseDto {
  items: GeoAreaItemDto[];
}

export class GeoGuResponseDto {
  signguCode: string;
  signguName: string;
  adstrdCode?: string;
  adstrdName?: string;
}

export class GetGeoGuQueryDto {
  @IsNumberString()
  @IsNotEmpty()
  lat: string;

  @IsNumberString()
  @IsNotEmpty()
  lng: string;
}

export class GetGeoGuListQueryDto {
  @IsNumberString()
  @IsOptional()
  cityCode?: string;
}

export class GetGeoDongListQueryDto {
  @IsNumberString()
  @IsNotEmpty()
  guCode: string;
}
