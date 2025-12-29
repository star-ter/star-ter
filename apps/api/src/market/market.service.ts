import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  GetMarketAnalysisQueryDto,
  MarketStoreListDto,
  MarketStore,
  GetBuildingStoreQueryDto,
  BuildingStoreCountDto,
} from './dto/market-store.dto';

import { OpenApiResponse, OpenApiStoreItem } from './dto/open-api.dto';
import { MarketAnalyticsDto } from './dto/market-analytics.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { KSIC_TO_CATEGORY } from './constants/ksic-category-map';
import {
  AdministrativeAreaResult,
  CommercialAreaResult,
} from './dto/market.interface';
import { SalesCommercial, SalesDong } from 'generated/prisma/client';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(private readonly prisma: PrismaService) {}

  private isValidOpenApiResponse(data: unknown): data is OpenApiResponse {
    if (typeof data !== 'object' || data === null) return false;
    const response = data as OpenApiResponse;
    return (
      'header' in response &&
      'body' in response &&
      Array.isArray(response.body?.items)
    );
  }

  private getCategoryByCode(code: string): string {
    return KSIC_TO_CATEGORY[String(code)] || '기타';
  }

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
    // TODO : DB 컬럼명 대소문자 이슈 -> 추후 수정 바람
    const result = await this.prisma.$queryRaw<CommercialAreaResult[]>`
      SELECT TRDAR_CD as "TRDAR_CD", TRDAR_CD_N as "TRDAR_CD_NM", TRDAR_SE_1 as "TRDAR_SE_1"
      FROM seoul_commercial_area_grid
      WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
      LIMIT 1
    `;
    return result[0] || null;
  }
  private async findAdministrativeDistrict(
    lat: number,
    lng: number,
  ): Promise<AdministrativeAreaResult | null> {
    // 1. area_dong에는 geom/polygon이 없으므로, admin_area_dong에서 찾음
    // 2. admin_area_dong.polygons(JSONB)를 GeoJSON으로 변환하여 ST_Intersects 수행
    const result = await this.prisma.$queryRaw<AdministrativeAreaResult[]>`
      SELECT adm_cd::text as "ADSTRD_CD", adm_nm as "ADSTRD_NM"
      FROM admin_area_dong
      WHERE ST_Intersects(
        ST_SetSRID(
          ST_GeomFromGeoJSON(
            jsonb_build_object(
              'type',
              CASE WHEN jsonb_typeof(polygons #> '{0,0,0}') = 'number' THEN 'Polygon' ELSE 'MultiPolygon' END,
              'coordinates',
              polygons
            )
          ),
          4326
        ),
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
      )
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
    return {
      areaName: message,
      isCommercialArea: false,
      totalRevenue: 0,
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
      vitality: { openingRate: 0, closureRate: 0 },
      openingRate: 0,
      closureRate: 0,
    };
  }

  async getBuildingStoreCounts(
    query: GetBuildingStoreQueryDto,
  ): Promise<BuildingStoreCountDto[]> {
    const storesData = await this.fetchStoresInRectangle(query);
    const items = storesData.body?.items || [];

    // 필터링할 카테고리 목록 (Array 보장)
    let targetCategories: string[] = [];
    if (query.categories) {
      if (Array.isArray(query.categories)) {
        targetCategories = query.categories;
      } else {
        targetCategories = [query.categories];
      }
    }

    const grouped = new Map<string, OpenApiStoreItem[]>();

    items.forEach((item) => {
      if (!item.bldMngNo) return;

      // 카테고리 필터링 (indsLclsCd 사용 + indsLclsNm 이름 보완)
      if (targetCategories.length > 0) {
        // 1. 코드로 매핑된 카테고리 확인
        const categoryByCode = this.getCategoryByCode(item.indsLclsCd);
        // 2. API가 주는 대분류명(indsLclsNm) 직접 확인
        const categoryByName = item.indsLclsNm;

        // 둘 중 하나라도 타겟 카테고리에 포함되면 통과
        const isMatch =
          (categoryByCode && targetCategories.includes(categoryByCode)) ||
          (categoryByName && targetCategories.includes(categoryByName));

        if (!isMatch) return;
      }

      if (!grouped.has(item.bldMngNo)) {
        grouped.set(item.bldMngNo, []);
      }
      grouped.get(item.bldMngNo)!.push(item);
    });

    const result: BuildingStoreCountDto[] = [];

    for (const [key, storeItems] of grouped) {
      const representative = storeItems[0];
      if (representative.lat && representative.lon) {
        result.push({
          buildingId: key,
          lat: Number(representative.lat),
          lng: Number(representative.lon),
          count: storeItems.length,
          name: representative.bldNm || '상가건물',
        });
      }
    }

    return result;
  }

  private async fetchStoresInRectangle(
    query: GetBuildingStoreQueryDto,
  ): Promise<OpenApiResponse> {
    const BASE_URL =
      'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRectangle';
    const SERVICE_KEY = process.env.SBIZ_API_KEY;

    if (!SERVICE_KEY) {
      throw new InternalServerErrorException('SBIZ_API_KEY is not defined');
    }

    const queryParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      pageNo: '1',
      numOfRows: '500',
      minx: query.minx,
      miny: query.miny,
      maxx: query.maxx,
      maxy: query.maxy,
      type: 'json',
    });

    try {
      const response = await fetch(`${BASE_URL}?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenAPI Rectangle Error: ${errorText}`);
        throw new InternalServerErrorException('OpenAPI Error');
      }

      const data = (await response.json()) as unknown;
      if (this.isValidOpenApiResponse(data)) {
        return data;
      }

      this.logger.error('Invalid API Response format');
      return {
        header: { resultCode: 'Err', resultMsg: 'Invalid Format' },
        body: { items: [], totalCount: 0 },
      };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error('Fetch Rectangle Failed', errorMessage);
      return {
        header: { resultCode: 'Err', resultMsg: errorMessage },
        body: { items: [], totalCount: 0 },
      };
    }
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
    const data = (await response.json()) as unknown;
    if (!this.isValidOpenApiResponse(data)) {
      throw new InternalServerErrorException('Invalid API Response format');
    }
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
