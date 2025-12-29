import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';
import {
  GeoAreaListResponseDto,
  GeoGuResponseDto,
  GetGeoDongListQueryDto,
  GetGeoGuListQueryDto,
  GetGeoGuQueryDto,
} from './dto/geo.dto';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('gu')
  getGuByPoint(@Query() query: GetGeoGuQueryDto): Promise<GeoGuResponseDto> {
    return this.geoService.getGuByPoint(query);
  }

  @Get('gus')
  getGuList(
    @Query() query: GetGeoGuListQueryDto,
  ): Promise<GeoAreaListResponseDto> {
    return this.geoService.getGuList(query);
  }

  @Get('dongs')
  getDongList(
    @Query() query: GetGeoDongListQueryDto,
  ): Promise<GeoAreaListResponseDto> {
    return this.geoService.getDongList(query);
  }
}
