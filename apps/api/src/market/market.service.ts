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

import { MarketRepository } from './market.repository';
import { MarketMapper } from './market.mapper';

const PAGE_SIZE = 1000;
const MAX_PAGES_TO_FETCH = 10;

interface FetchPageResult {
  items: OpenApiStoreItem[];
  totalCount: number;
  header?: OpenApiResponse['header'];
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(private readonly marketRepository: MarketRepository) {}

  private isValidOpenApiResponse(data: unknown): data is OpenApiResponse {
    if (typeof data !== 'object' || data === null) return false;
    const response = data as OpenApiResponse;
    return 'header' in response && 'body' in response;
  }

  private getCategoryByCode(code: string): string {
    return KSIC_TO_CATEGORY[String(code)] || '기타';
  }

  private normalizeCategories(categories?: string | string[]): string[] {
    if (!categories) return [];
    return Array.isArray(categories) ? categories : [categories];
  }

  private shouldIncludeStore(
    item: OpenApiStoreItem,
    targetCategories: string[],
  ): boolean {
    if (targetCategories.length === 0) return true;

    // 1. 코드로 매핑된 카테고리 확인
    const categoryByCode = this.getCategoryByCode(item.indsLclsCd);
    // 2. API가 주는 대분류명(indsLclsNm) 직접 확인
    const categoryByName = item.indsLclsNm;

    // 둘 중 하나라도 타겟 카테고리에 포함되면 통과
    return (
      (!!categoryByCode && targetCategories.includes(categoryByCode)) ||
      (!!categoryByName && targetCategories.includes(categoryByName))
    );
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
      const salesData = await this.marketRepository.getCommercialRevenueTrend(
        commercialArea.TRDAR_CD,
      );
      return MarketMapper.mapToAnalyticsDto(
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
      const salesData = await this.marketRepository.getAdminDongRevenueTrend(
        adminArea.ADSTRD_CD,
      );
      return MarketMapper.mapToAnalyticsDto(
        salesData,
        adminArea.ADSTRD_NM,
        false,
      );
    }

    return MarketMapper.getEmptySalesData('분석할 수 없는 지역입니다.');
  }

  async getBuildingStoreCounts(
    query: GetBuildingStoreQueryDto,
  ): Promise<BuildingStoreCountDto[]> {
    const storesData = await this.fetchStoresInRectangle(query);
    const items = storesData.body?.items || [];

    const targetCategories = this.normalizeCategories(query.categories);

    const grouped = new Map<string, OpenApiStoreItem[]>();

    items.forEach((item) => {
      // 1. 건물 번호 없으면 제외
      if (!item.bldMngNo) return;

      // 2. 카테고리 필터링
      if (!this.shouldIncludeStore(item, targetCategories)) return;

      // 3. 그룹화
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
    const SERVICE_KEY = process.env.SBIZ_API_KEY;
    if (!SERVICE_KEY) {
      throw new InternalServerErrorException('SBIZ_API_KEY is not defined');
    }

    try {
      const firstPageResult = await this.fetchStorePage(1, query, SERVICE_KEY);

      const allItems = [...firstPageResult.items];
      const totalCount = firstPageResult.totalCount;

      if (totalCount > allItems.length) {
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        const pagesToFetch: number[] = [];
        for (let p = 2; p <= totalPages && p <= MAX_PAGES_TO_FETCH; p++) {
          pagesToFetch.push(p);
        }
        // 3. Parallel Fetch using Helper
        const results = await Promise.all(
          pagesToFetch.map((p) => this.fetchStorePage(p, query, SERVICE_KEY)),
        );
        // 4. Merge
        results.forEach((res) => allItems.push(...res.items));
      }
      return {
        header: firstPageResult.header || {
          resultCode: '00',
          resultMsg: 'NORMAL SERVICE.',
        },
        body: { items: allItems, totalCount },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Fetch Rectangle Failed: ${msg}`);
      return {
        header: { resultCode: 'Err', resultMsg: msg },
        body: { items: [], totalCount: 0 },
      };
    }
  }
  private async fetchStorePage(
    page: number,
    query: GetBuildingStoreQueryDto,
    serviceKey: string,
  ): Promise<FetchPageResult> {
    const params = new URLSearchParams({
      serviceKey: serviceKey,
      pageNo: String(page),
      numOfRows: String(PAGE_SIZE),
      minx: query.minx,
      miny: query.miny,
      maxx: query.maxx,
      maxy: query.maxy,
      type: 'json',
    });

    const url = `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRectangle?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        this.logger.warn(`Page ${page} fetch failed: ${response.status}`);
        return { items: [], totalCount: 0 };
      }
      const data = (await response.json()) as unknown;
      if (this.isValidOpenApiResponse(data)) {
        return {
          items: data.body.items || [],
          totalCount: data.body.totalCount || 0,
          header: data.header,
        };
      }
      return { items: [], totalCount: 0 };
    } catch (error) {
      this.logger.error(`Page ${page} error: ${error}`);
      return { items: [], totalCount: 0 };
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
    //this.logger.log(`${BASE_URL}?${queryParams.toString()}`);

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
      this.logger.error(`${BASE_URL}?${queryParams.toString()}`);
      throw new InternalServerErrorException('Invalid API Response format');
    }

    if (!data.body.items) {
      data.body.items = [];
    }

    return data;
  }

  private mapToMarketStores(items: OpenApiStoreItem[]): MarketStore[] {
    return items.map((item) => ({
      name: item.bizesNm,
      category: item.indsLclsNm,
      subcategory: item.ksicNm,
    }));
  }
}
