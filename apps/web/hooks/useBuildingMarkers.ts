import { useEffect, useRef, useCallback } from 'react';
import { KakaoMap, KakaoCustomOverlay } from '../types/map-types';
import { IndustryCategory } from '../types/bottom-menu-types';

interface BuildingStoreData {
  buildingId: string;
  lat: number;
  lng: number;
  count: number;
  name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Frontend Code -> Backend Category List Mapping
const mapCodeToBackend = (code: string): string[] => {
  if (code === 'I2') return ['음식'];
  if (code === 'G2') return ['소매'];
  if (code === 'S2') return ['생활서비스'];
  if (code === 'R2') return ['오락/여가', '문화'];
  if (code === 'P1') return ['교육'];
  if (code === 'I1') return ['숙박'];
  if (code === 'L1') return ['생활서비스'];
  if (code === 'M1') return ['전문 서비스'];
  if (code === 'N1') return ['문화'];
  if (code === 'Q1') return ['의료'];
  return [];
};

const CATEGORY_COLORS: Record<string, string> = {
  I2: '#F97316', // Orange (Food)
  G2: '#EF4444', // Red (Retail)
  S2: '#8B5CF6', // Purple (Service)
  R2: '#EC4899', // Pink (Leisure)
  P1: '#10B981', // Emerald (Education)
  I1: '#3B82F6', // Blue (Accommodation)
  L1: '#6366F1', // Indigo (Real Estate)
  M1: '#14B8A6', // Teal (Professional)
  N1: '#F43F5E', // Rose (Support)
  Q1: '#22C55E', // Green (Medical)
};

export const useBuildingMarkers = (
  map: KakaoMap | null,
  selectedCategory: IndustryCategory | null,
) => {
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  // 개발자가 조절할 수 있는 Threshold (기본 3개 이상 표시)
  const THRESHOLD = 1;

  // 마커(오버레이) 모두 지우기
  const clearMarkers = useCallback(() => {
    customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    customOverlaysRef.current = [];
  }, []);

  // API 호출 및 마커 그리기
  const fetchAndDrawMarkers = useCallback(async () => {
    if (!map) return;

    // 카테고리가 선택되지 않았으면 마커를 표시하지 않음 (User Request: "선택한 카테고리에 해당하는 마커만")
    // If you want to show ALL when nothing selected, remove this check.
    // However, user said "Turn on/off", and usually selection implies turning ON specific filter.
    // Let's assume: If null, don't show building markers (clean map).
    if (!selectedCategory) {
      clearMarkers();
      return;
    }

    // 1. 줌 레벨 체크 (너무 넓은 영역이면 조회 안함)
    const level = map.getLevel();
    // 1~3: 상세, 4: 적당. 5부터는 숨김
    if (level > 4) {
      clearMarkers();
      return;
    }

    // 2. 현재 지도 영역(Bounding Box) 가져오기
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const minx = sw.getLng();
    const miny = sw.getLat();
    const maxx = ne.getLng();
    const maxy = ne.getLat();

    try {
      // 3. API 호출
      const params = new URLSearchParams({
        minx: minx.toString(),
        miny: miny.toString(),
        maxx: maxx.toString(),
        maxy: maxy.toString(),
      });

      const categories = mapCodeToBackend(selectedCategory.code);
      categories.forEach((cat) => params.append('categories', cat));

      const res = await fetch(
        `${API_BASE_URL}/market/building-stores?${params.toString()}`,
      );
      if (!res.ok) throw new Error('Failed to fetch building store counts');

      const data: BuildingStoreData[] = await res.json();

      // 4. 기존 마커 지우고 새로 그리기
      clearMarkers();

      const color = CATEGORY_COLORS[selectedCategory.code] || '#3B82F6';

      data.forEach((item) => {
        // Threshold Check
        if (item.count < THRESHOLD) return;

        // Premium UI Content (Glassmorphism, No Text Name)
        const content = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 2px solid ${color};
            border-radius: 50%;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
          ">
            <span style="
              font-size: 14px;
              font-weight: 800;
              color: ${color};
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            ">${item.count}</span>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0; 
              height: 0; 
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid ${color};
            "></div>
          </div>
          <style>
            @keyframes bounceIn {
              from { opacity: 0; transform: scale(0.5); }
              to { opacity: 1; transform: scale(1); }
            }
          </style>
        `;

        const position = new window.kakao.maps.LatLng(item.lat, item.lng);

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: content,
          yAnchor: 1.1,
          zIndex: 3,
        });

        customOverlay.setMap(map);
        customOverlaysRef.current.push(customOverlay);
      });
    } catch (err) {
      console.error('Building Marker Fetch Error:', err);
    }
  }, [map, selectedCategory, clearMarkers]); // Dependency Updated

  useEffect(() => {
    if (!map) return;

    fetchAndDrawMarkers();

    const onIdle = () => {
      fetchAndDrawMarkers();
    };

    window.kakao.maps.event.addListener(map, 'idle', onIdle);
    return () => {
      // But we MUST clear markers when unmounting or category changing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.kakao.maps.event as any).removeListener(map, 'idle', onIdle);
      clearMarkers();
    };
  }, [map, fetchAndDrawMarkers, clearMarkers]);

  return {
    refreshMarkers: fetchAndDrawMarkers,
  };
};
