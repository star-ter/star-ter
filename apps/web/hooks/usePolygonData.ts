import { useRef, useEffect } from 'react';
import {
  KakaoMap,
  AdminArea,
  BuildingArea,
  KakaoPolygon,
  KakaoCustomOverlay,
  InfoBarData,
  CommercialApiResponse,
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
  const onPolygonClickRef = useRef(onPolygonClick);

  useEffect(() => {
    onPolygonClickRef.current = onPolygonClick;
  }, [onPolygonClick]);

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
          (data) => onPolygonClickRef.current(data),
        );
      }
    } catch (err) {
      console.error('Combined Boundary Fetch Error:', err);
    }
  }

  // 건물 데이터를 비동기로 호출하고 지도에 그리는 함수.
  async function fetchBuildingVworld(map: KakaoMap) {
    console.log(`Fetching Building Data...`);

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // V-World API에 보낼 BBOX (minx, miny, maxx, maxy)
    const minx = sw.getLng();
    const miny = sw.getLat();
    const maxx = ne.getLng();
    const maxy = ne.getLat();

    try {
      const res = await fetch(
        `${API_BASE_URL}/polygon/building?minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}`,
      );
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
          (data) => onPolygonClickRef.current(data),
        );
      } else {
        console.warn('Building API No Data or Error:', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Building API Fetch Error:', err);
    }
  }

  // 상권 데이터를 비동기로 호출하고 지도에 그리는 함수.
  async function fetchCommercialData(map: KakaoMap) {
    console.log(`Fetching Commercial Data...`);
    try {
      const response = await fetch(`${API_BASE_URL}/polygon/commercial`);
      const data = await response.json();

      if (Array.isArray(data)) {
        console.log(`Received ${data.length} commercial areas`);

        // GeoJSON Feature -> CommercialArea 매핑
        const commercialAreas = (data as CommercialApiResponse[]).map(
          (feature) => ({
            TRDAR_SE_1: feature.properties.TRDAR_SE_1,
            TRDAR_CD_N: feature.properties.TRDAR_CD_N,
            SIGNGU_CD_: feature.properties.SIGNGU_CD_,
            ADSTRD_CD_: feature.properties.ADSTRD_CD_,
            polygons: feature.geometry.coordinates,
          }),
        );

        drawPolygons(
          map,
          commercialAreas,
          'commercial',
          polygonsRef,
          customOverlaysRef,
          (data) => onPolygonClickRef.current(data),
        );
      }
    } catch (err) {
      console.error('Commercial API Fetch Error:', err);
    }
  }

  function refreshLayer(map: KakaoMap) {
    const level = map.getLevel();
    console.log(`Current Zoom Level: ${level}`);

    let currentGroup = '';
    if (level >= 7) currentGroup = 'GU';
    else if (level >= 5) currentGroup = 'DONG';
    else if (level >= 2) currentGroup = 'COMMERCIAL';
    else currentGroup = 'BUILDING';

    if (
      currentGroup === lastLevelGroupRef.current &&
      (currentGroup === 'GU' ||
        currentGroup === 'DONG' ||
        currentGroup === 'COMMERCIAL')
    ) {
      console.log(`Skipping fetch for static layer: ${currentGroup}`);
      // 상권 데이터는 mock이므로 한번만 가져와도 됨 (하지만 지도 이동 시 다시 가져오지 않도록 static 취급)
      return;
    }

    lastLevelGroupRef.current = currentGroup;

    if (level >= 7) {
      fetchCombinedBoundary(map, 1);
    } else if (level >= 5) {
      fetchCombinedBoundary(map, 2);
    } else if (level >= 2) {
      fetchCommercialData(map);
    } else {
      fetchBuildingVworld(map);
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
