import { Controller, Get, Query } from '@nestjs/common';
import { PolygonService } from './polygon.service';
import { BuildingPolygonResponse } from './dto/building-polygon-dto';
import { AdminPolygonResponse } from './dto/admin-polygon-dto';

@Controller('polygon')
export class PolygonController {
  constructor(private readonly polygonService: PolygonService) {}

  @Get('admin')
  getAdminPolygon(
    @Query('low_search') lowSearch: number,
  ): Promise<AdminPolygonResponse[]> {
    return this.polygonService.getAdminPolygonByLowSearch(lowSearch);
  }

  @Get('building')
  getBuildingPolygon(
    @Query('minx') minx: string,
    @Query('miny') miny: string,
    @Query('maxx') maxx: string,
    @Query('maxy') maxy: string,
  ): Promise<BuildingPolygonResponse[]> {
    if (!minx || !miny || !maxx || !maxy) {
      // BBox가 없으면 빈 배열 혹은 에러 반환 (일단 빈 배열)
      return Promise.resolve([]);
    }
    return this.polygonService.getBuildingPolygon(minx, miny, maxx, maxy);
  }
}
