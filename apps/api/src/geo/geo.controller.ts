import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';
import { GeoGuResponseDto, GetGeoGuQueryDto } from './dto/geo.dto';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('gu')
  getGuByPoint(@Query() query: GetGeoGuQueryDto): Promise<GeoGuResponseDto> {
    return this.geoService.getGuByPoint(query);
  }
}
