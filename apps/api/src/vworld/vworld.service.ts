import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VworldService {
  private readonly logger = new Logger(VworldService.name);

  constructor(private configService: ConfigService) {}

  async getBuilding(minx: number, miny: number, maxx: number, maxy: number) {
    const key = this.configService.get<string>('VWORLD_API_KEY');
    const domain = 'http://localhost:3000'; // V-World requires a registered domain

    // V-World Data API (WFS like)
    // LT_C_SPBD: Building Polygon Data
    const baseUrl = 'http://api.vworld.kr/req/data';
    const params = new URLSearchParams({
      service: 'data',
      request: 'GetFeature',
      data: 'LT_C_SPBD',
      key: key || '',
      domain: domain,
      geomFilter: `BOX(${minx},${miny},${maxx},${maxy})`,
      size: '1000', // Max features
    });

    const url = `${baseUrl}?${params.toString()}`;
    this.logger.log(`[VWorld] Requesting: ${url}`);

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `V-World API HTTP Error: ${response.status} ${response.statusText}`,
        );
        throw new Error(`V-World API Error: ${response.statusText}`);
      }

      // Log the response result for debugging
      if (data?.response?.status !== 'OK') {
        this.logger.warn(`V-World API Logic Error: ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      this.logger.error('V-World Proxy Error', error);
      throw error;
    }
  }
}
