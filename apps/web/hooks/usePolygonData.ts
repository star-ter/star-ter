import { useRef, useEffect } from 'react';
import {
  KakaoMap,
  KakaoPolygon,
  KakaoCustomOverlay,
  InfoBarData,
} from '../types/map-types';
import { drawPolygons } from '../utils/kakao-draw-utils';
import {
  isAdminAreaList,
  isBuildingAreaList,
  isCommercialApiResponseList,
} from '@/utils/type-guards';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const usePolygonData = (
  map: KakaoMap | null,
  onPolygonClick: (data: InfoBarData) => void,
) => {
  const lastLevelGroupRef = useRef<string | null>(null);
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const onPolygonClickRef = useRef(onPolygonClick);
  const visitedCommercialRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onPolygonClickRef.current = onPolygonClick;
  }, [onPolygonClick]);

  async function fetchCombinedBoundary(map: KakaoMap, lowSearch: number) {
    console.log(`Fetching Combined Boundary...`);
    try {
      const url = `${API_BASE_URL}/polygon/admin?low_search=${lowSearch}`;

      const response = await fetch(url);
      const data = await response.json();

      if (isAdminAreaList(data)) {
        console.log(`Drawing ${data.length} features`);
        drawPolygons(
          map,
          data,
          'admin',
          polygonsRef,
          customOverlaysRef,
          (data) => onPolygonClickRef.current(data),
        );
      } else {
        console.warn('AdminArea 데이터 형식이 아니거나 비어 있음!!');
      }
    } catch (err) {
      console.error('Combined Boundary Fetch Error:', err);
    }
  }

  async function fetchBuildingData(map: KakaoMap) {
    console.log(`Fetching Building Data (DB Filtered)...`);

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
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

      if (isBuildingAreaList(features)) {
        console.log(`Received ${features.length} buildings`);
        drawPolygons(
          map,
          features,
          'building_store',
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

  async function fetchCommercialData(map: KakaoMap) {
    console.log(`Fetching Commercial Data...`);

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const query = new URLSearchParams({
      minx: sw.getLng().toString(),
      miny: sw.getLat().toString(),
      maxx: ne.getLng().toString(),
      maxy: ne.getLat().toString(),
    });

    console.time('상권 데이터 로딩 시간');

    try {
      const response = await fetch(
        `${API_BASE_URL}/polygon/commercial?${query}`,
      );
      const data = await response.json();

      if (isCommercialApiResponseList(data)) {
        console.log(`Received ${data.length} commercial areas`);

        const commercialAreas = data.map((feature) => ({
          commercialType: feature.properties.commercialType,
          commercialName: feature.properties.commercialName,
          commercialCode:
            feature.code || feature.properties.commercialCode || '',
          guCode: feature.properties.guCode,
          dongCode: feature.properties.dongCode,
          polygons: feature.polygons.coordinates,
          revenue: feature.revenue,
        }));

        const newCommercialAreas = commercialAreas.filter((area) => {
          if (visitedCommercialRef.current.has(area.commercialName))
            return false;
          visitedCommercialRef.current.add(area.commercialName);
          return true;
        });

        if (newCommercialAreas.length > 0) {
          drawPolygons(
            map,
            newCommercialAreas,
            'commercial',
            polygonsRef,
            customOverlaysRef,
            (data) => onPolygonClickRef.current(data),
            false,
          );
        }
        console.timeEnd('상권 데이터 로딩 시간');
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

    if (currentGroup !== lastLevelGroupRef.current) {
      polygonsRef.current.forEach((polygon) => {
        polygon.setMap(null);
      });
      customOverlaysRef.current.forEach((overlay) => {
        overlay.setMap(null);
      });

      visitedCommercialRef.current.clear();
    }

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
    } else if (level >= 5) {
      fetchCombinedBoundary(map, 2);
    } else if (level >= 2) {
      fetchCommercialData(map);
    } else {
      fetchBuildingData(map);
    }
  }

  useEffect(() => {
    if (!map) return;

    refreshLayer(map);

    let timeoutId: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshLayer(map);
      }, 500);
    };

    window.kakao.maps.event.addListener(map, 'idle', debouncedRefresh);
    window.kakao.maps.event.addListener(map, 'zoom_changed', debouncedRefresh);
  }, [map]);
};
