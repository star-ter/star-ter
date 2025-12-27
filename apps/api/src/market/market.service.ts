import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  GetMarketAnalysisQueryDto,
  MarketAnalysisResponseDto,
} from './dto/market-analysis.dto';

interface CommercialArea {
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  async getAnalysisData(
    query: GetMarketAnalysisQueryDto,
  ): Promise<MarketAnalysisResponseDto> {
    const lat = parseFloat(query.latitude);
    const lng = parseFloat(query.longitude);
    const polygon = query.polygon;

    this.logger.log(`[프론트으로부터 상권 분석 요청] Lat: ${lat}, Lng: ${lng}`);

    let stores: any[] = [];
    if (polygon) {
      this.logger.log(`[폴리곤 WKT도 같이 받음] 길이: ${polygon.length}`);
      try {
        const externalStoreData = await this.fetchStoreDataFromOpenApi(polygon);

        // 데이터 구조 확인 및 매핑
        if (externalStoreData.body && externalStoreData.body.items) {
          stores = externalStoreData.body.items.map((item: any) => ({
            name: item.bizesNm, // 상호명
            category: item.indsLclsNm, // 상권업종대분류명
            subcategory: item.ksicNm, // 표준산업분류명 (User Request)
          }));
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
      isCommercialZone: stores.length >= 10, // 임시 기준
      areaName:
        stores.length > 0
          ? stores[0].ctprvnNm || '상권 분석 지역'
          : '선택된 지역',
      estimatedRevenue: 45000000,
      salesDescription: '선택하신 영역의 상가 정보입니다.',
      reviewSummary: { naver: '데이터 분석 중...', google: 'Analyzing...' },
      stores: stores,
      openingRate: 2.1,
      closureRate: 1.5,
    };
  }

  private async fetchStoreDataFromOpenApi(wkt: string): Promise<any> {
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
    const data = await response.json();
    return data;
  }
}
