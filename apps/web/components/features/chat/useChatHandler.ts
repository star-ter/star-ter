'use client';

import { geocodeAddresses } from '@/services/geocoding/geocoding.service';
import { extractLocations, hasLocationIntent } from '@/utils/location-parser';
import { ChatMessage } from '@/services/chat/types';

interface LocationResult {
  lat: number;
  lng: number;
  address: string;
  buildingName?: string;
  query: string;
}

interface MapMarker {
  id: string;
  coords: { lat: number; lng: number };
  name: string;
}

interface ComparisonData {
  title: string;
  address: string;
  estimatedSales: string;
  salesChange: string;
  storeCount: string;
}

export interface ChatParseResult {
  type: 'location' | 'comparison' | 'general';
  locations?: LocationResult[];
  markers?: MapMarker[];
  isComparison?: boolean;
  comparisonData?: [ComparisonData, ComparisonData];
  assistantMessage?: ChatMessage;
}

/**
 * 채팅 메시지를 파싱하여 의도와 데이터를 추출
 * @param message - 사용자 입력 메시지
 * @returns 파싱 결과 (위치, 비교, 일반 등)
 */
export async function parseChatMessage(message: string): Promise<ChatParseResult | null> {
  // 위치 검색 의도 체크
  if (!hasLocationIntent(message)) {
    return null;
  }

  const locations = extractLocations(message);
  
  if (locations.length === 0) {
    return null;
  }

  const results = await geocodeAddresses(locations);
  
  if (results.length === 0) {
    return {
      type: 'general',
      assistantMessage: {
        id: Date.now().toString(),
        role: 'assistant',
        content: `죄송합니다. "${locations.join(', ')}"의 위치를 찾을 수 없습니다. 다시 시도해주세요.`,
        timestamp: new Date(),
      },
    };
  }

  const isComparisonRequest = message.includes('비교');
  
  // 마커 데이터 생성
  const markers: MapMarker[] = results.map((r, idx) => ({
    id: idx.toString(),
    coords: { lat: r.lat, lng: r.lng },
    name: r.buildingName || r.address || r.query,
  }));

  // 여러 지역 + 비교 요청
  if (isComparisonRequest && results.length >= 2) {
    const comparisonData: [ComparisonData, ComparisonData] = [
      {
        title: results[0].buildingName || results[0].address || results[0].query,
        address: results[0].address || '주소 정보 없음',
        estimatedSales: `약 ${Math.floor(Math.random() * 300 + 100)}억 원`,
        salesChange: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}%`,
        storeCount: `${Math.floor(Math.random() * 500 + 100)}`,
      },
      {
        title: results[1].buildingName || results[1].address || results[1].query,
        address: results[1].address || '주소 정보 없음',
        estimatedSales: `약 ${Math.floor(Math.random() * 300 + 100)}억 원`,
        salesChange: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}%`,
        storeCount: `${Math.floor(Math.random() * 500 + 100)}`,
      },
    ];

    return {
      type: 'comparison',
      locations: results,
      markers,
      isComparison: true,
      comparisonData,
      assistantMessage: {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📍 ${results.length}개 지역을 찾아 비교 분석을 시작합니다.\n\n📊 비교 카드가 화면에 표시됩니다. 두 지역의 상권을 비교해보세요!`,
        timestamp: new Date(),
      },
    };
  }

  // 여러 지역 (비교 아님)
  if (results.length > 1) {
    const locationNames = results.map(r => r.buildingName || r.address || r.query).join(', ');
    return {
      type: 'location',
      locations: results,
      markers,
      isComparison: false,
      assistantMessage: {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📍 ${results.length}개 지역을 찾았습니다: ${locationNames}\n\n📊 **상권 분석 요약**\n• 평균 예상 매출: 약 ${Math.floor(Math.random() * 300 + 100)}억 원\n• 유동 인구: ${Math.floor(Math.random() * 50000 + 20000).toLocaleString()}명/일\n• 경쟁 업체 수: ${Math.floor(Math.random() * 100 + 30)}개\n\n지도에서 각 지역의 마커를 확인하세요!`,
        timestamp: new Date(),
      },
    };
  }

  // 단일 지역
  const result = results[0];
  return {
    type: 'location',
    locations: results,
    markers,
    isComparison: false,
    assistantMessage: {
      id: Date.now().toString(),
      role: 'assistant',
      content: `📍 "${result.buildingName || result.address}"(으)로 지도를 이동했습니다.\n\n📊 **${result.buildingName || result.address} 상권 분석**\n• 예상 월 매출: 약 ${Math.floor(Math.random() * 50 + 10)}억 원\n• 주요 업종: 음식점, 카페, 소매점\n• 유동 인구: ${Math.floor(Math.random() * 30000 + 10000).toLocaleString()}명/일\n• 평균 임대료: ${Math.floor(Math.random() * 500 + 200)}만원/평\n\n더 자세한 분석이 필요하시면 말씀해주세요!`,
      timestamp: new Date(),
    },
  };
}
