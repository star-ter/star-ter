import { Controller, Get, Query } from '@nestjs/common';
import { FloatingPopulationService } from './floating-population.service';
import { TimeSegmentedLayerResponse } from './dto/floating-population-response.dto';

@Controller('floating-population')
export class FloatingPopulationController {
  constructor(
    private readonly floatingPopulationService: FloatingPopulationService,
  ) {}

  @Get('layer')
  async getLayer(
    @Query('minLat') minLat: string,
    @Query('minLng') minLng: string,
    @Query('maxLat') maxLat: string,
    @Query('maxLng') maxLng: string,
  ): Promise<TimeSegmentedLayerResponse> {
    return this.floatingPopulationService.getCombinedLayerByBounds(
      parseFloat(minLat),
      parseFloat(minLng),
      parseFloat(maxLat),
      parseFloat(maxLng),
    );
  }
}
