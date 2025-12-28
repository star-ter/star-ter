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
import { SalesCommercial, SalesDong } from 'generated/prisma/client';

interface CommercialAreaResult {
  TRDAR_CD: string;
  TRDAR_CD_NM: string;
  TRDAR_SE_1: string;
}

interface AdministrativeAreaResult {
  ADSTRD_CD: string;
  ADSTRD_NM: string;
}

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(MarketService.name);

  async getStoreList(
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
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const commercialArea = await this.findCommercialArea(lat, lng);

    if (commercialArea) {
      return this.getCommercialSales(
        commercialArea.TRDAR_CD,
        commercialArea.TRDAR_CD_NM,
        //commercialArea.TRDAR_SE_1,
      );
    }

    const adminArea = await this.findAdministrativeDistrict(lat, lng);
    if (adminArea) {
      return this.getAdministrativeSales(
        adminArea.ADSTRD_CD,
        adminArea.ADSTRD_NM,
      );
    }

    return this.getEmptySalesData('분석할 수 없는 지역입니다.');
  }
  // postgis라서 rawquery 사용
  private async findCommercialArea(
    lat: number,
    lng: number,
  ): Promise<CommercialAreaResult | null> {
    const result = await this.prisma.$queryRaw<CommercialAreaResult[]>`
      SELECT TRDAR_CD, TRDAR_CD_NM, TRDAR_SE_1
      FROM seoul_commercial_area_grid
      WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
      LIMIT 1
    `;
    return result[0] || null;
  }
  //TODO: 현재 DB 내 area_dong 테이블에는 폴리곤 데이터가 없음. 테이블에 넣어야 함, 또한 행정동 코드가 서로 안맞음
  private async findAdministrativeDistrict(
    lat: number,
    lng: number,
  ): Promise<AdministrativeAreaResult | null> {
    const result = await this.prisma.$queryRaw<AdministrativeAreaResult[]>`
      SELECT ADSTRD_CD, ADSTRD_NM
      FROM area_dong
      WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
      LIMIT 1
    `;
    return result[0] || null;
  }

  // 상권 매출 데이터 조회
  private async getCommercialSales(
    code: string,
    name: string,
    //commercialCategory: string,
  ): Promise<MarketAnalyticsDto> {
    const salesData = await this.prisma.salesCommercial.findMany({
      where: { TRDAR_CD: code },
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: 5,
    });
    return this.mapToAnalyticsDto(salesData, name, true);
  }

  // 행정동 매출 데이터 조회
  private async getAdministrativeSales(
    code: string,
    name: string,
  ): Promise<MarketAnalyticsDto> {
    const salesData = await this.prisma.salesDong.findMany({
      where: { ADSTRD_CD: code },
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: 5,
    });
    return this.mapToAnalyticsDto(salesData, name, false);
  }

  private mapToAnalyticsDto(
    rows: (SalesCommercial | SalesDong)[],
    areaName: string,
    isCommercial: boolean,
  ): MarketAnalyticsDto {
    if (!rows || rows.length === 0) {
      return this.getEmptySalesData(`${areaName} (데이터 없음)`);
    }
    const latest = rows[0];
    return {
      areaName,
      isCommercialArea: isCommercial,
      totalRevenue: Number(latest.THSMON_SELNG_AMT),
      sales: {
        trend: rows
          .slice(0, 4)
          .reverse()
          .map((row) => ({
            year: row.STDR_YYQU_CD.substring(0, 4),
            quarter: row.STDR_YYQU_CD.substring(4, 5),
            revenue: Number(row.THSMON_SELNG_AMT),
          })),
        timeSlot: {
          time0006: Number(latest.TMZON_00_06_SELNG_AMT),
          time0611: Number(latest.TMZON_06_11_SELNG_AMT),
          time1114: Number(latest.TMZON_11_14_SELNG_AMT),
          time1417: Number(latest.TMZON_14_17_SELNG_AMT),
          time1721: Number(latest.TMZON_17_21_SELNG_AMT),
          time2124: Number(latest.TMZON_21_24_SELNG_AMT),
          peakTimeSummaryComment: '시간대별 매출 분포입니다.',
        },
        dayOfWeek: {
          mon: Number(latest.MON_SELNG_AMT),
          tue: Number(latest.TUES_SELNG_AMT),
          wed: Number(latest.WED_SELNG_AMT),
          thu: Number(latest.THUR_SELNG_AMT),
          fri: Number(latest.FRI_SELNG_AMT),
          sat: Number(latest.SAT_SELNG_AMT),
          sun: Number(latest.SUN_SELNG_AMT),
          peakDaySummaryComment: '요일별 매출 분포입니다.',
        },
        demographics: {
          male: Number(latest.ML_SELNG_AMT),
          female: Number(latest.FML_SELNG_AMT),
          age10: Number(latest.AGRDE_10_SELNG_AMT),
          age20: Number(latest.AGRDE_20_SELNG_AMT),
          age30: Number(latest.AGRDE_30_SELNG_AMT),
          age40: Number(latest.AGRDE_40_SELNG_AMT),
          age50: Number(latest.AGRDE_50_SELNG_AMT),
          age60: Number(latest.AGRDE_60_ABOVE_SELNG_AMT),
          primaryGroupSummaryComment: '성별/연령별 매출 분포입니다.',
        },
        topIndustries: [],
      },
      vitality: { openingRate: 0, closureRate: 0 },
      openingRate: 0,
      closureRate: 0,
    };
  }

  private getEmptySalesData(message: string): MarketAnalyticsDto {
    // ... (기존과 동일, 빈 객체 반환)
    return { areaName: message, isCommercialArea: false } as any;
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
