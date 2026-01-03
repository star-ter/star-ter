import { Controller, Get, Query } from '@nestjs/common';
import { PolygonService } from './polygon.service';
import { BuildingPolygonResponse } from './dto/building-polygon-dto';
import { AdminPolygonResponse } from './dto/admin-polygon-dto';

import { CommercialPolygonResponse } from './dto/commercial-polygon-dto';

@Controller('polygon')
export class PolygonController {
  constructor(private readonly polygonService: PolygonService) {}

  @Get('admin')
  getAdminPolygon(
    @Query('low_search') lowSearch: number,
    @Query('industryCode') industryCode?: string,
    @Query('industryCodes') industryCodes?: string,
  ): Promise<AdminPolygonResponse[]> {
    return this.polygonService.getAdminPolygonByLowSearch(
      lowSearch,
      industryCode,
      industryCodes,
    );
  }

  @Get('building')
  getCommercialBuildingPolygon(
    @Query('minx') minx: string,
    @Query('miny') miny: string,
    @Query('maxx') maxx: string,
    @Query('maxy') maxy: string,
  ): Promise<BuildingPolygonResponse[]> {
    if (!minx || !miny || !maxx || !maxy) {
      return Promise.resolve([]);
    }
    return this.polygonService.getCommercialBuildingPolygons(
      minx,
      miny,
      maxx,
      maxy,
    );
  }

  @Get('commercial')
  getCommercialPolygon(
    @Query('minx') minx: string,
    @Query('miny') miny: string,
    @Query('maxx') maxx: string,
    @Query('maxy') maxy: string,
    @Query('industryCode') industryCode?: string,
    @Query('industryCodes') industryCodes?: string,
  ): Promise<CommercialPolygonResponse[]> {
    return this.polygonService.getCommercialPolygon(
      minx,
      miny,
      maxx,
      maxy,
      industryCode,
      industryCodes,
    );
  }

  @Get('sido')
  getSeoulSidoPolygon(): Promise<AdminPolygonResponse | null> {
    return this.polygonService.getSeoulSidoPolygon();
  }
}
