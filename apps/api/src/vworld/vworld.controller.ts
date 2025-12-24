import { Controller, Get, Query } from '@nestjs/common';
import { VworldService } from './vworld.service';

@Controller('vworld')
export class VworldController {
  constructor(private readonly vworldService: VworldService) {}

  @Get('building')
  async getBuilding(
    @Query('minx') minx: number,
    @Query('miny') miny: number,
    @Query('maxx') maxx: number,
    @Query('maxy') maxy: number,
  ) {
    return this.vworldService.getBuilding(minx, miny, maxx, maxy);
  }
}
