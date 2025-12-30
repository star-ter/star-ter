import { useRef, useEffect } from 'react';
import { KakaoMap, AdminArea, KakaoPolygon, KakaoCustomOverlay } from '../types/map-types';
import { drawPolygons } from '../utils/kakao-draw-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/**
 * 서울특별시 전체 테두리(시도 경계)를 그려주는 훅입니다.
 */
export const useSeoulBoundary = (map: KakaoMap | null) => {
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  // 시도 경계는 텍스트 라벨이 필요 없으므로 빈 Ref 사용
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);

  useEffect(() => {
    if (!map) return;

    const fetchSeoulBoundary = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/polygon/sido`);
        const data = await response.json();

        if (data) {
          // 전역 drawPolygons 함수를 활용하되, 'sido' 타입을 처리할 수 있도록 할 예정입니다.
          // 현재는 'admin' 타입을 사용하되 스타일만 별도로 지정하거나 drawPolygons를 확장합니다.
          drawPolygons(
            map,
            [data] as AdminArea[],
            'sido', // 'sido' type for special styling
            polygonsRef,
            customOverlaysRef,
            () => {}, // 테두리는 클릭 이벤트 불필요
            false,    // 기존 폴리곤 유지
          );
        }
      } catch (err) {
        console.error('Seoul Boundary Fetch Error:', err);
      }
    };

    fetchSeoulBoundary();

    return () => {
      polygonsRef.current.forEach((poly) => poly.setMap(null));
      polygonsRef.current = [];
    };
  }, [map]);
};
