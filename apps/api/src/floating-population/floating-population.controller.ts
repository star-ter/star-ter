import { Controller, Get, Query } from '@nestjs/common';
import { FloatingPopulationService } from './floating-population.service';
import { FloatingPopulationResponse } from './dto/floating-population-response.dto';

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
}
