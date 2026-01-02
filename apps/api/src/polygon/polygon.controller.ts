import { Controller, Get, Query } from '@nestjs/common';
import { PolygonService } from './polygon.service';
import { AdminPolygonResponse } from './dto/admin-polygon-dto';
import { BuildingPolygonResponse } from './dto/building-polygon-dto';
import { CommercialPolygonResponse } from './dto/commercial-polygon-dto';

@Controller('polygon')
export class PolygonController {
  constructor(private readonly polygonService: PolygonService) {}

  private parseIndustryCodes(codes?: string): string[] | undefined {
    if (!codes) return undefined;
    const parsed = codes.split(',').filter((code) => code.trim());
    return parsed.length > 0 ? parsed : undefined;
  }

  @Get('admin')
  getAdminPolygon(
    @Query('low_search') lowSearch: number,
    @Query('industryCodes') industryCodes?: string,
  ): Promise<AdminPolygonResponse[]> {
    return this.polygonService.getAdminPolygonByLowSearch(
      lowSearch,
      this.parseIndustryCodes(industryCodes),
    );
  }

  @Get('building')
  getBuildingPolygon(
    @Query('minx') minx: string,
    @Query('miny') miny: string,
    @Query('maxx') maxx: string,
    @Query('maxy') maxy: string,
  ): Promise<BuildingPolygonResponse[]> {
    const hasAllBounds = minx && miny && maxx && maxy;
    if (!hasAllBounds) return Promise.resolve([]);
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
    @Query('industryCodes') industryCodes?: string,
  ): Promise<CommercialPolygonResponse[]> {
    return this.polygonService.getCommercialPolygon(
      minx,
      miny,
      maxx,
      maxy,
      this.parseIndustryCodes(industryCodes),
    );
  }

  @Get('sido')
  getSeoulSidoPolygon(): Promise<AdminPolygonResponse | null> {
    return this.polygonService.getSeoulSidoPolygon();
  }
}
