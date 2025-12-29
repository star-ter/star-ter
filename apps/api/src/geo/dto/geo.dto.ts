import { IsNotEmpty, IsNumberString } from 'class-validator';

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
