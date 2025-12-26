import { Controller, Get, Query } from '@nestjs/common';
import { PolygonService } from './polygon.service';
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

  // TODO : 지금 현재 DB에 건물 데이터가 없어서 주석처리
  // @Get('building')
  // getBuildingPolygon(): BuildingPolygonResponse[] {
  //   return this.polygonService.getBuildingPolygon();
  // }
}
