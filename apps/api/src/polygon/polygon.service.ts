import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BuildingPolygonResponse } from './dto/building-polygon-dto';

@Injectable()
export class PolygonService {
  constructor(private readonly prisma: PrismaService) {}

  getAdminPolygonByLowSearch(lowSearch: number) {
    if (lowSearch == 2) {
      return this.prisma.adminAreaDong.findMany();
    }
    return this.prisma.adminAreaGu.findMany();
  }

  async getBuildingPolygon(
    minx: string,
    miny: string,
    maxx: string,
    maxy: string,
  ): Promise<BuildingPolygonResponse[]> {
    const BASE_URL = 'https://api.vworld.kr/req/data';
    const key = process.env.VWORLD_API_KEY;

    if (!key) {
      throw new InternalServerErrorException('VWORLD_API_KEY is missing');
    }

    try {
      const queryParams = new URLSearchParams({
        service: 'data',
        request: 'GetFeature',
        data: 'LT_C_SPBD',
        key: key,
        format: 'json',
        geomFilter: `BOX(${minx},${miny},${maxx},${maxy})`,
        crs: 'EPSG:4326',
        size: '500',
        domain: 'localhost', // 배포 시 실제 도메인으로 변경 필요
      });

      const response = await fetch(`${BASE_URL}?${queryParams}`);
      if (!response.ok) {
        throw new InternalServerErrorException(
          `V-World API Error: ${response.statusText}`,
        );
      }

      // V-World API Response Types
      interface VWorldFeature {
        type: string;
        geometry: {
          type: string;
          coordinates: number[][][] | number[][][][];
        };
        properties: {
          buld_nm?: string;
          [key: string]: unknown;
        };
      }

      interface VWorldResponse {
        response: {
          status: string;
          error?: { text: string };
          result?: {
            featureCollection?: {
              features: VWorldFeature[];
            };
          };
        };
      }

      const json = (await response.json()) as VWorldResponse;

      if (json.response && json.response.status === 'ERROR') {
        throw new BadRequestException(
          `V-World Error: ${json.response.error?.text || 'Unknown Error'}`,
        );
      }

      const features = json.response?.result?.featureCollection?.features || [];

      return features.map((feature: VWorldFeature) => {
        const props = feature.properties;
        const geometry = feature.geometry;

        const fullAddr = [props.sido, props.sigungu, props.gu]
          .filter(Boolean)
          .join(' ');

        return {
          buld_nm: props.buld_nm,
          adm_nm: fullAddr,
          polygons: geometry.coordinates as any, // JsonValue 호환
          // x, y, adm_cd는 V-World API 응답에 명확치 않아 생략 (Nullable)
        } as BuildingPolygonResponse;
      });
    } catch (error) {
      console.error('V-World Proxy Error:', error);
      // 에러 시 빈 배열 반환할지, 에러를 던질지 정책 결정 (일단 에러 던짐)
      throw error;
    }
  }
}
