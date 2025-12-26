import { Controller, Get, Query } from '@nestjs/common';
import { PolygonService } from './polygon.service';
import { BuildingPolygonResponse } from './dto/building-polygon-dto';
import { AdminPolygonResponse } from './dto/admin-polygon-dto';

@Controller('polygon')
export class PolygonController {
  constructor(private readonly polygonService: PolygonService) {}

  @Get('admin')
  async getAdminPolygon(
    @Query('low_search') lowSearch: number,
  ): Promise<AdminPolygonResponse[]> {
    return this.polygonService.getAdminPolygonByLowSearch(lowSearch);
  }

  @Get('building')
  getBuildingPolygon(): BuildingPolygonResponse[] {
    return this.polygonService.getBuildingPolygon();
  }
}
