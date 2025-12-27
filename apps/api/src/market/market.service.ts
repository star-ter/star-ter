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
    if (polygon) {
      this.logger.log(`[폴리곤 WKT도 같이 받음] 길이: ${polygon.length}`);
      try {
        const externalStoreData = await this.fetchStoreDataFromOpenApi(polygon);
        this.logger.log(
          `[외부 데이터] ${JSON.stringify(externalStoreData, null, 2)}`,
        );
      } catch (error) {
        this.logger.error('Fetch 실패 외부 API', error);
      }
    } else {
      this.logger.log('No polygon');
    }

    return {
      isCommercialZone: false,
      areaName: '일반 주거지역',
      estimatedRevenue: 45000000,
      salesDescription: '거주민 중심의 안정적인 지역입니다.',
      reviewSummary: { naver: '조용해요', google: 'Peaceful' },
      stores: [
        { name: '동네 세탁소', category: '서비스' },
        { name: '편의점', category: '유통' },
      ],
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
