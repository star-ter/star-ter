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
import { KSIC_TO_CATEGORY } from './constants/ksic-category-map';

import { SalesCommercial, SalesDong } from 'generated/prisma/client';
import { MarketRepository } from './market.repository';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(private readonly marketRepository: MarketRepository) {}

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
      reviewSummary: { naver: '여기 끝내줘요!!!' },
      stores: stores,
    };
  }
  async getAnalytics(
    query: GetMarketAnalysisQueryDto,
  ): Promise<MarketAnalyticsDto> {
    const { latitude, longitude } = query;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const commercialArea = await this.marketRepository.findCommercialArea(
      lat,
      lng,
    );
    if (commercialArea) {
      const salesData = await this.marketRepository.getCommercialSales(
        commercialArea.TRDAR_CD,
      );
      return this.mapToAnalyticsDto(
        salesData,
        commercialArea.TRDAR_CD_NM,
        true,
      );
    }

    const adminArea = await this.marketRepository.findAdministrativeDistrict(
      lat,
      lng,
    );
    if (adminArea) {
      const salesData = await this.marketRepository.getAdministrativeSales(
        adminArea.ADSTRD_CD,
      );
      return this.mapToAnalyticsDto(salesData, adminArea.ADSTRD_NM, false);
    }

    return this.getEmptySalesData('분석할 수 없는 지역입니다.');
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

    const numOfRows = 1000; // Maximize page size (limit usually 1000)
    const pageNo = 1;

    const buildUrl = (page: number) => {
      const params = new URLSearchParams({
        serviceKey: SERVICE_KEY,
        pageNo: String(page),
        numOfRows: String(numOfRows),
        minx: query.minx,
        miny: query.miny,
        maxx: query.maxx,
        maxy: query.maxy,
        type: 'json',
      });
      return `${BASE_URL}?${params.toString()}`;
    };

    try {
      // 1. Fetch First Page
      const firstRes = await fetch(buildUrl(pageNo), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!firstRes.ok) {
        throw new Error(`First Page Fail: ${firstRes.status}`);
      }

      const firstData = (await firstRes.json()) as unknown;
      if (!this.isValidOpenApiResponse(firstData)) {
        throw new Error('Invalid First Page Format');
      }

      const totalCount = firstData.body.totalCount;
      const allItems = [...firstData.body.items];

      // 2. Fetch Remaining Pages if needed
      if (totalCount > allItems.length) {
        const totalPages = Math.ceil(totalCount / numOfRows);
        const maxPages = 10; // Safety Limit (Max 10,000 items)
        const fetchPages: Promise<OpenApiStoreItem[]>[] = [];

        for (let p = 2; p <= totalPages && p <= maxPages; p++) {
          fetchPages.push(
            fetch(buildUrl(p), {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
              .then((res) => res.json())
              .then((data) => {
                if (this.isValidOpenApiResponse(data)) {
                  return data.body.items;
                }
                return [];
              })
              .catch((err) => {
                this.logger.error(`Page ${p} fetch error`, err);
                return [];
              }),
          );
        }

        const results = await Promise.all(fetchPages);
        results.forEach((pageItems) => {
          if (Array.isArray(pageItems)) {
            allItems.push(...pageItems);
          }
        });
      }

      // Return combined result pretending to be a single large page
      return {
        header: firstData.header,
        body: {
          items: allItems,
          totalCount: totalCount, // Keep original total count
        },
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
