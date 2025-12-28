import { Controller, Get, Query } from '@nestjs/common';
import { FloatingPopulationService } from './floating-population.service';
import {
  FloatingPopulationResponse,
  CombinedLayerResponse,
} from './dto/floating-population-response.dto';

@Controller('floating-population')
export class FloatingPopulationController {
  constructor(
    private readonly floatingPopulationService: FloatingPopulationService,
  ) {}

  @Get()
  async getPopulation(
    @Query('start') start: number = 1,
    @Query('end') end: number = 10000,
  ): Promise<FloatingPopulationResponse> {
    return this.floatingPopulationService.getPopulationData(start, end);
  }

  @Get('layer')
  async getLayer(
    @Query('minLat') minLat?: string,
    @Query('minLng') minLng?: string,
    @Query('maxLat') maxLat?: string,
    @Query('maxLng') maxLng?: string,
  ): Promise<CombinedLayerResponse> {
    if (minLat && minLng && maxLat && maxLng) {
      return this.floatingPopulationService.getCombinedLayerByBounds(
        Number(minLat),
        Number(minLng),
        Number(maxLat),
        Number(maxLng),
      );
    }
    return this.floatingPopulationService.getCombinedLayer();
  }
}
