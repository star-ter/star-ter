import { Injectable, Logger } from '@nestjs/common';
import { FloatingPopulationRepository } from './floating-population.repository';
import { TimeSegmentedLayerResponse } from './dto/floating-population-response.dto';

@Injectable()
export class FloatingPopulationService {
  private readonly logger = new Logger(FloatingPopulationService.name);

  constructor(private readonly repository: FloatingPopulationRepository) {}

  // db에서 조회
  async getCombinedLayerByBounds(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<TimeSegmentedLayerResponse> {
    try {
      const features = await this.repository.findTimeSegmentedLayer(
        minLat,
        minLng,
        maxLat,
        maxLng,
      );
      return { features };
    } catch (error) {
      this.logger.error('Failed to fetch population layer by bounds', error);
      return { features: [] };
    }
  }
}
