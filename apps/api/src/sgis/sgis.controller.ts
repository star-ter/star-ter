import { Controller, Get, Query } from '@nestjs/common';
import { SgisService } from './sgis.service';

@Controller('sgis')
export class SgisController {
  constructor(private readonly sgisService: SgisService) {}

  @Get('boundary')
  async getBoundary(
    @Query('low_search') lowSearch: number,
    @Query('adm_cd') admCd: string,
  ) {
    return this.sgisService.getBoundary(lowSearch, admCd);
  }

  @Get('userarea')
  async getUserArea(
    @Query('minx') minx: number,
    @Query('miny') miny: number,
    @Query('maxx') maxx: number,
    @Query('maxy') maxy: number,
    @Query('cd') cd: string,
  ) {
    return this.sgisService.getUserArea(minx, miny, maxx, maxy, cd);
  }
}
hello;
