import { Injectable } from '@nestjs/common';
import { FloatingPopulationRepository } from './floating-population.repository';
import { TimeSegmentedLayerResponse } from './dto/floating-population-response.dto';

@Injectable()
export class FloatingPopulationService {
  constructor(private readonly repository: FloatingPopulationRepository) {}

  // db 데이터
  async getCombinedLayerByBounds(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<TimeSegmentedLayerResponse> {
    const features = await this.repository.findTimeSegmentedLayer(
      minLat,
      minLng,
      maxLat,
      maxLng,
    );

    return { features };
  }
}
