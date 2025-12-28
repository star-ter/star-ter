import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  GetMarketAnalysisQueryDto,
  MarketStoreListDto,
  MarketStore,
} from './dto/market-store.dto';

import { OpenApiResponse, OpenApiStoreItem } from './dto/open-api.dto';
import { MarketAnalyticsDto } from './dto/market-analytics.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(MarketService.name);

  async getAnalysisData(
    query: GetMarketAnalysisQueryDto,
  ): Promise<MarketStoreListDto> {
    const lat = parseFloat(query.latitude);
    const lng = parseFloat(query.longitude);
    const polygon = query.polygon;

    this.logger.log(`[프론트으로부터 상권 분석 요청] Lat: ${lat}, Lng: ${lng}`);

    let stores: MarketStore[] = [];
    if (polygon) {
      this.logger.log(`[폴리곤 WKT도 같이 받음] 길이: ${polygon.length}`);
      try {
        const externalStoreData = await this.fetchStoreDataFromOpenApi(polygon);
        const items = externalStoreData.body?.items;

        // 데이터 구조 확인 및 매핑
        if (items && items.length > 0) {
          stores = this.mapToMarketStores(items);
          this.logger.log(`[데이터 매핑 완료] ${stores.length}개 업소`);
        } else {
          this.logger.warn('[외부 데이터] items가 없습니다.');
        }
      } catch (error) {
        this.logger.error('Fetch 실패 외부 API', error);
      }
    } else {
      this.logger.log('No polygon');
    }

    // 데이터가 없으면 빈 배열 반환 (더미 데이터 제거)
    if (stores.length === 0) {
      this.logger.log('분석된 상가 데이터가 없습니다.');
    }

    return {
      areaName: '선택된 지역',
      reviewSummary: { naver: '데이터 분석 중...' },
      stores: stores,
    };
  }
  async getAnalytics(
    query: GetMarketAnalysisQueryDto,
  ): Promise<MarketAnalyticsDto> {
    const { latitude, longitude } = query;

    const commercialArea = await this.prisma.$queryRaw<any[]>`
      SELECT TRDAR_CD, TRDAR_CD_NM, TRDAR_SE_1
      FROM seoul_commercial_area_grid
      WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326))
      LIMIT 1
    `;

    if (commercialArea[0]) {
      return this.getCommercialSales(
        commercialArea[0].TRDAR_CD,
        commercialArea[0].TRDAR_CD_NM,
        commercialArea[0].TRDAR_SE_1,
      );
    } else {
      return this.getEmptySalesData('행정동 분석 정보');
    }
  }

  // [Mock] 상권 매출 데이터 (Mock Data)
  private async getCommercialSales(
    code: string,
    name: string,
    commercialCategory: string,
  ): Promise<MarketAnalyticsDto> {
    return {
      areaName: name,
      isCommercialArea: true,
      totalRevenue: 45000000,

      // 생명력 데이터 (Mock)
      vitality: {
        openingRate: 2.1,
        closureRate: 1.5,
      },
      // (레거시 필드 호환용 - 나중에 삭제 가능)
      openingRate: 2.1,
      closureRate: 1.5,
      // 매출 상세 (Mock)
      sales: {
        trend: [
          { year: '2024', quarter: '1', revenue: 42000000 },
          { year: '2024', quarter: '2', revenue: 45000000 },
          { year: '2024', quarter: '3', revenue: 47000000 },
        ],
        timeSlot: {
          time0006: 5,
          time0611: 10,
          time1114: 35,
          time1417: 15,
          time1721: 25,
          time2124: 10,
          peakTimeSummaryComment: '점심 시간대(11-14시)가 가장 활발합니다.',
        },
        dayOfWeek: {
          mon: 12,
          tue: 13,
          wed: 15,
          thu: 15,
          fri: 20,
          sat: 18,
          sun: 7,
          peakDaySummaryComment: '금요일 매출이 가장 높습니다.',
        },
        demographics: {
          male: 45,
          female: 55,
          age10: 5,
          age20: 30,
          age30: 35,
          age40: 15,
          age50: 10,
          age60: 5,
          primaryGroupSummaryComment: '30대 여성이 주 고객층입니다.',
        },
        topIndustries: [
          { name: '한식', ratio: 35 },
          { name: '카페', ratio: 20 },
        ],
      },
    };
  }
  // [Mock] 비상권 데이터
  private getEmptySalesData(message: string): MarketAnalyticsDto {
    return {
      areaName: message,
      isCommercialArea: false,
      totalRevenue: 0,

      vitality: { openingRate: 0, closureRate: 0 },
      openingRate: 0,
      closureRate: 0,
      sales: {
        trend: [],
        timeSlot: {
          time0006: 0,
          time0611: 0,
          time1114: 0,
          time1417: 0,
          time1721: 0,
          time2124: 0,
          peakTimeSummaryComment: '데이터 없음',
        },
        dayOfWeek: {
          mon: 0,
          tue: 0,
          wed: 0,
          thu: 0,
          fri: 0,
          sat: 0,
          sun: 0,
          peakDaySummaryComment: '데이터 없음',
        },
        demographics: {
          male: 0,
          female: 0,
          age10: 0,
          age20: 0,
          age30: 0,
          age40: 0,
          age50: 0,
          age60: 0,
          primaryGroupSummaryComment: '데이터 없음',
        },
        topIndustries: [],
      },
    };
  }

  private async fetchStoreDataFromOpenApi(
    wkt: string,
  ): Promise<OpenApiResponse> {
    const BASE_URL =
      'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInPolygon';
    const SERVICE_KEY = process.env.SBIZ_API_KEY;

    if (!SERVICE_KEY) {
      throw new InternalServerErrorException('SBIZ_API_KEY is not defined');
    }

    const queryParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      pageNo: '1',
      numOfRows: '20',
      key: wkt,
      type: 'json',
    });
    this.logger.log(`${BASE_URL}?${queryParams.toString()}`);

    const response = await fetch(`${BASE_URL}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `OpenAPI Error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }
    const data = (await response.json()) as OpenApiResponse;
    return data;
  }

  private mapToMarketStores(items: OpenApiStoreItem[]): MarketStore[] {
    return items.map((item) => ({
      name: item.bizesNm, // 상호명
      category: item.indsLclsNm, // 상권업종대분류명
      subcategory: item.ksicNm, // 표준산업분류명 (User Request)
    }));
  }
}
