import { useRef, useEffect } from 'react';
import {
  KakaoMap,
  AdminArea,
  BuildingArea,
  KakaoPolygon,
  KakaoCustomOverlay,
  InfoBarData,
} from '../types/map-types';
import { drawPolygons } from '../utils/kakao-draw-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const usePolygonData = (
  map: KakaoMap | null,
  onPolygonClick: (data: InfoBarData) => void,
) => {
  const lastLevelGroupRef = useRef<string | null>(null);
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);

  // 구/동 데이터를 비동기로 호출하고 지도에 그리는 함수.
  async function fetchCombinedBoundary(map: KakaoMap, lowSearch: number) {
    console.log(`Fetching Combined Boundary...`);
    try {
      const url = `${API_BASE_URL}/polygon/admin?low_search=${lowSearch}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        console.log(`Drawing ${data.length} features`);
        drawPolygons(
          map,
          data as AdminArea[],
          'admin',
          polygonsRef,
          customOverlaysRef,
          onPolygonClick,
        );
      }
    } catch (err) {
      console.error('Combined Boundary Fetch Error:', err);
    }
  }

  // 건물 데이터를 비동기로 호출하고 지도에 그리는 함수.
  async function fetchBuildingMock(map: KakaoMap) {
    console.log(`Fetching Building Mock Data...`);

    try {
      const res = await fetch(`${API_BASE_URL}/polygon/building`);
      const data = await res.json();

      const features = data;

      if (Array.isArray(features)) {
        console.log(`Received ${features.length} buildings`);
        drawPolygons(
          map,
          features as BuildingArea[],
          'vworld_building',
          polygonsRef,
          customOverlaysRef,
          onPolygonClick,
        );
      } else {
        console.warn('Building Mock No Data or Error:', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Building Mock Fetch Error:', err);
    }
  }

  function refreshLayer(map: KakaoMap) {
    const level = map.getLevel();
    console.log(`Current Zoom Level: ${level}`);

    let currentGroup = '';
    if (level >= 7) currentGroup = 'GU';
    else if (level >= 4) currentGroup = 'DONG';
    else currentGroup = 'BUILDING';

    if (
      currentGroup === lastLevelGroupRef.current &&
      (currentGroup === 'GU' || currentGroup === 'DONG')
    ) {
      console.log(`Skipping fetch for static layer: ${currentGroup}`);
      return;
    }

    lastLevelGroupRef.current = currentGroup;

    if (level >= 7) {
      fetchCombinedBoundary(map, 1);
    } else if (level >= 4) {
      fetchCombinedBoundary(map, 2);
    } else {
      fetchBuildingMock(map);
    }
  }

  useEffect(() => {
    if (!map) return;

    // Initial load
    refreshLayer(map);

    // Debounce refresh
    let timeoutId: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshLayer(map);
      }, 500);
    };

    // 지도가 변할 때 마다 refreshLayer 함수를 호출하여 데이터를 다시 그리는 함수.
    window.kakao.maps.event.addListener(map, 'idle', debouncedRefresh);
    window.kakao.maps.event.addListener(map, 'zoom_changed', debouncedRefresh);
  }, [map]);
};
