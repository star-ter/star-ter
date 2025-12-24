import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SgisService {
  private readonly logger = new Logger(SgisService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private configService: ConfigService) {}

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    // Cache check with 1-minute buffer
    if (this.accessToken && now < this.tokenExpiresAt - 60 * 1000) {
      return this.accessToken;
    }

    const key = this.configService.get<string>('SGIS_CONSUMER_KEY');
    const secret = this.configService.get<string>('SGIS_CONSUMER_SECRET');
    const baseUrl = 'https://sgisapi.mods.go.kr';

    this.logger.log('Fetching new SGIS access token...');

    try {
      const response = await fetch(
        `${baseUrl}/OpenAPI3/auth/authentication.json?consumer_key=${key}&consumer_secret=${secret}`,
      );
      const data = await response.json();

      if (data.errCd === 0 && data.result.accessToken) {
        this.accessToken = data.result.accessToken;
        // Token typically valid for 4 hours; refresh every 2 hours safely
        this.tokenExpiresAt = now + 2 * 60 * 60 * 1000;
        return this.accessToken as string;
      } else {
        throw new Error(`SGIS Auth Failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      this.logger.error('Failed to fetch SGIS token', error);
      throw error;
    }
  }

  async getBoundary(lowSearch: number, admCd: string) {
    try {
      const token = await this.getAccessToken();
      const baseUrl = 'https://sgisapi.mods.go.kr';
      const year = '2025';

      const url = `${baseUrl}/OpenAPI3/boundary/hadmarea.geojson?accessToken=${token}&year=${year}&adm_cd=${admCd}&low_search=${lowSearch}`;
      this.logger.log(`[Boundary] Requesting: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`SGIS Boundary Fetch Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      this.logger.error('SGIS Boundary Error', error);
      throw error;
    }
  }

  async getUserArea(
    minx: number,
    miny: number,
    maxx: number,
    maxy: number,
    cd: string,
  ) {
    try {
      const token = await this.getAccessToken();
      const baseUrl = 'https://sgisapi.mods.go.kr';

      let url = `${baseUrl}/OpenAPI3/boundary/userarea.geojson?accessToken=${token}&cd=${cd}`;

      if (minx && miny && maxx && maxy) {
        url += `&minx=${Number(minx).toFixed(2)}&miny=${Number(miny).toFixed(2)}&maxx=${Number(maxx).toFixed(2)}&maxy=${Number(maxy).toFixed(2)}`;
      }

      this.logger.log(`[UserArea] Requesting: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`SGIS UserArea Error ${response.status}: ${text}`);
      }
      return await response.json();
    } catch (error) {
      this.logger.error('SGIS UserArea Error', error);
      throw error;
    }
  }
}
