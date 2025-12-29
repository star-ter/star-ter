import { useEffect, useRef, useCallback } from 'react';
import { KakaoMap, KakaoCustomOverlay } from '../types/map-types';

interface BuildingStoreData {
  buildingId: string;
  lat: number;
  lng: number;
  count: number;
  name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useBuildingMarkers = (map: KakaoMap | null) => {
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);

  // 마커(오버레이) 모두 지우기
  const clearMarkers = () => {
    customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    customOverlaysRef.current = [];
  };

  // API 호출 및 마커 그리기
  const fetchAndDrawMarkers = useCallback(async () => {
    if (!map) return;

    // 1. 줌 레벨 체크 (너무 넓은 영역이면 조회 안함)
    const level = map.getLevel();
    // 1~3레벨: 상세, 4~: 광역 이라치면, 4레벨 이하에서만 보이게 설정 (숫자는 조정 가능)
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
      const query = new URLSearchParams({
        minx: minx.toString(),
        miny: miny.toString(),
        maxx: maxx.toString(),
        maxy: maxy.toString(),
      });

      const res = await fetch(
        `${API_BASE_URL}/market/building-stores?${query}`,
      );
      if (!res.ok) throw new Error('Failed to fetch building store counts');

      const data: BuildingStoreData[] = await res.json();

      // 4. 기존 마커 지우고 새로 그리기
      clearMarkers();

      data.forEach((item) => {
        // 커스텀 오버레이 내용 (HTML)
        // 스타일은 Tailwind 또는 Inline Style 사용
        const content = `
          <div style="
            background: white; 
            border: 2px solid #3B82F6; 
            border-radius: 12px; 
            padding: 4px 8px; 
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            min-width: 60px;
          ">
            <div style="font-size: 11px; color: #666; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 80px;">${item.name}</div>
            <div style="font-size: 14px; font-weight: bold; color: #3B82F6;">${item.count}개</div>
          </div>
        `;

        const position = new window.kakao.maps.LatLng(item.lat, item.lng);

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: content,
          yAnchor: 1.2, // 마커가 건물 위에 살짝 떠있게
        });

        customOverlay.setMap(map);
        customOverlaysRef.current.push(customOverlay);
      });
    } catch (err) {
      console.error('Building Marker Fetch Error:', err);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    // 초기 로딩 시 실행
    fetchAndDrawMarkers();

    // 지도 이동 멈출 때마다 실행 (Debounce 적용 권장하나, 여기선 onIdle 사용)
    const onIdle = () => {
      fetchAndDrawMarkers();
    };

    window.kakao.maps.event.addListener(map, 'idle', onIdle);
    return () => {
      // Cleanup
      // map 인스턴스가 바뀌거나 언마운트 시 리스너 제거가 까다로울 수 있음 (Kakao Maps API 특성상)
      // 여기선 오버레이만 지움
      clearMarkers();
    };
  }, [map, fetchAndDrawMarkers]);

  return {
    refreshMarkers: fetchAndDrawMarkers,
  };
};
