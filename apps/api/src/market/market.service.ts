import { Injectable } from '@nestjs/common';
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
  private readonly commercialAreas: CommercialArea[] = [
    { name: '샤로수길', lat: 37.478, lng: 126.952, radius: 500 },
  ];
  getAnalysisData(query: GetMarketAnalysisQueryDto): MarketAnalysisResponseDto {
    const lat = parseFloat(query.latitude);
    const lng = parseFloat(query.longitude);

    let nearestArea: CommercialArea | null = null;
    let minDistance = Infinity;

    for (const area of this.commercialAreas) {
      const distance = this.calculateDistance(lat, lng, area.lat, area.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestArea = area;
      }
    }
    if (nearestArea && minDistance <= nearestArea.radius) {
      // [Case A] 상권 안쪽임 -> Hot Place(상권) 정보 반환
      return {
        isCommercialZone: true,
        areaName: nearestArea.name,
        estimatedRevenue: 1560000000,
        salesDescription: '주말 저녁 유동인구 최상위 지역입니다.',
        reviewSummary: { naver: '웨이팅 필수!', google: 'Great vibe' },
        stores: [
          { name: '멘쇼우라멘', category: '일식' },
          { name: '스타벅스', category: '카페' },
        ],
        openingRate: 6.8,
        closureRate: 1.2,
      };
    } else {
      // [Case B] 상권 바깥쪽 -> 일반 행정동 평균 정보 반환
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
  }
  // haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // 지구의 반지름 (약 6,371km)

    // 각도를 라디안으로 변환
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 거리 (미터)
  }
}
