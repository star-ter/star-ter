import { useEffect, useRef, useCallback } from 'react';
import { KakaoMap, KakaoCustomOverlay } from '../types/map-types';
import { IndustryCategory } from '../types/bottom-menu-types';
import { createMarkerContent } from '@/utils/building-marker-utils';

interface BuildingStoreData {
  buildingId: string;
  lat: number;
  lng: number;
  count: number;
  name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const mapCodeToBackend = (code: string): string[] => {
  if (code.startsWith('I2')) return ['음식'];
  if (code.startsWith('G2')) return ['소매'];
  if (code.startsWith('S2')) return ['생활서비스'];
  if (code.startsWith('R1')) return ['오락/스포츠'];
  if (code.startsWith('P1')) return ['교육'];
  if (code.startsWith('I1')) return ['숙박'];
  if (code.startsWith('Q1')) return ['의료/건강'];
  return [];
};

const CATEGORY_COLORS: Record<string, string> = {
  I2: '#F97316',
  G2: '#EF4444',
  S2: '#8B5CF6',
  R1: '#EC4899',
  P1: '#CA8A04',
  I1: '#06B6D4',
  Q1: '#22C55E',
};

export const useBuildingMarkers = (
  map: KakaoMap | null,
  selectedCategory: IndustryCategory | null,
) => {
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);

  const TOTAL_VIEW_THRESHOLD = 1;
  const CATEGORY_VIEW_THRESHOLD = 1;

  const DEFAULT_MARKET_COLOR = '#3B82F6';

  const clearMarkers = useCallback(() => {
    customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    customOverlaysRef.current = [];
  }, []);

  const fetchAndDrawMarkers = useCallback(async () => {
    if (!map) return;

    const level = map.getLevel();
    if (level > 3) {
      clearMarkers();
      return;
    }

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const REDUCTION_RATIO = 0.7;

    const width = ne.getLng() - sw.getLng();
    const height = ne.getLat() - sw.getLat();

    const minx = sw.getLng() + (width * (1 - REDUCTION_RATIO)) / 2;
    const miny = sw.getLat() + (height * (1 - REDUCTION_RATIO)) / 2;
    const maxx = ne.getLng() - (width * (1 - REDUCTION_RATIO)) / 2;
    const maxy = ne.getLat() - (height * (1 - REDUCTION_RATIO)) / 2;

    try {
      const params = new URLSearchParams({
        minx: minx.toString(),
        miny: miny.toString(),
        maxx: maxx.toString(),
        maxy: maxy.toString(),
      });

      let currentThreshold = TOTAL_VIEW_THRESHOLD;
      let currentColor = DEFAULT_MARKET_COLOR;

      if (selectedCategory) {
        currentThreshold = CATEGORY_VIEW_THRESHOLD;
        currentColor =
          CATEGORY_COLORS[selectedCategory.code] || DEFAULT_MARKET_COLOR;
        params.append('categories', selectedCategory.code);
      }

      const res = await fetch(
        `${API_BASE_URL}/market/building-stores?${params.toString()}`,
      );
      if (!res.ok) throw new Error('Failed to fetch building store counts');

      const data: BuildingStoreData[] = await res.json();

      let displayData = data;

      // 레벨 3일때만 필터링
      if (level == 3 || level == 2) {
        displayData = [...data].sort((a, b) => b.count - a.count).slice(0, 35);
      }

      clearMarkers();

      displayData.forEach((item) => {
        if (item.count < currentThreshold) return;

        const categoryName = selectedCategory ? selectedCategory.name : '전체';

        const content = createMarkerContent(
          item.count,
          currentColor,
          categoryName,
        );

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
  }, [map, selectedCategory, clearMarkers]);

  useEffect(() => {
    if (!map) return;

    fetchAndDrawMarkers();

    const onIdle = () => {
      fetchAndDrawMarkers();
    };

    window.kakao.maps.event.addListener(map, 'idle', onIdle);
    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', onIdle);
      clearMarkers();
    };
  }, [map, fetchAndDrawMarkers, clearMarkers]);

  return {
    refreshMarkers: fetchAndDrawMarkers,
  };
};
