import { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  KakaoMap,
  AdminArea,
  BuildingArea,
  KakaoPolygon,
  KakaoCustomOverlay,
  InfoBarData,
  CommercialApiResponse,
} from '../types/map-types';
import { drawPolygons, drawMarkers } from '../utils/kakao-draw-utils';
import { useMapStore } from '../stores/useMapStore';
import { API_ENDPOINTS } from '../config/api';
import { useBookmark } from './useBookmark';
import { IndustryCategory } from '../types/bottom-menu-types';

export const usePolygonData = (
  map: KakaoMap | null,
  onPolygonClick: (data: InfoBarData) => void,
  selectedCategory?: IndustryCategory | null,
  selectedSubCategoryCode?: string | null,
) => {
  const { overlayMode } = useMapStore();
  const { bookmarks } = useBookmark();

  const bookmarksSet = useMemo(() => {
    return new Set(bookmarks.map((b) => b.commercialCode));
  }, [bookmarks]);

  const lastLevelGroupRef = useRef<string | null>(null);
  const lastOverlayModeRef = useRef<string>('revenue');
  const lastIndustryKeyRef = useRef<string>('');
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const onPolygonClickRef = useRef(onPolygonClick);
  const visitedCommercialRef = useRef<Set<string>>(new Set());
  const allCommercialFeaturesRef = useRef<CommercialApiResponse[]>([]);

  const industryParams = useMemo(() => {
    if (overlayMode !== 'revenue') return null;
    if (selectedSubCategoryCode) {
      return { industryCode: selectedSubCategoryCode };
    }
    if (!selectedCategory) return null;
    if (selectedCategory.children && selectedCategory.children.length > 0) {
      const codes = selectedCategory.children.map((c) => c.code).join(',');
      return { industryCodes: codes };
    }
    return { industryCode: selectedCategory.code };
  }, [overlayMode, selectedCategory, selectedSubCategoryCode]);

  const industryKey =
    industryParams?.industryCodes || industryParams?.industryCode || '';

  useEffect(() => {
    onPolygonClickRef.current = onPolygonClick;
  }, [onPolygonClick]);

  const fetchCombinedBoundary = useCallback(
    async (mapInstance: KakaoMap, lowSearch: number) => {
      try {
        const url = new URL(API_ENDPOINTS.POLYGON_ADMIN);
        url.searchParams.set('low_search', String(lowSearch));
        if (industryParams?.industryCode) {
          url.searchParams.set('industryCode', industryParams.industryCode);
        }
        if (industryParams?.industryCodes) {
          url.searchParams.set('industryCodes', industryParams.industryCodes);
        }
        const response = await fetch(url.toString());
        const data: unknown = await response.json();

        if (Array.isArray(data)) {
          drawPolygons(
            mapInstance,
            data as AdminArea[],
            'admin',
            polygonsRef,
            customOverlaysRef,
            (clickedData) => onPolygonClickRef.current(clickedData),
            true,
            overlayMode,
            lowSearch === 1 ? 'gu' : 'dong',
            true,
            bookmarksSet,
          );
        }
      } catch {
        return;
      }
    },
    [overlayMode, bookmarksSet, industryParams],
  );

  const fetchBuildingData = useCallback(
    async (mapInstance: KakaoMap) => {
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      try {
        const query = new URLSearchParams({
          minx: sw.getLng().toString(),
          miny: sw.getLat().toString(),
          maxx: ne.getLng().toString(),
          maxy: ne.getLat().toString(),
        });
        const url = `${API_ENDPOINTS.POLYGON_BUILDING}?${query}`;
        const res = await fetch(url);
        const data: unknown = await res.json();

        if (Array.isArray(data)) {
          drawPolygons(
            mapInstance,
            data as BuildingArea[],
            'building_store',
            polygonsRef,
            customOverlaysRef,
            (clickedData) => onPolygonClickRef.current(clickedData),
            true,
            overlayMode,
            undefined,
            false, // 건물 마커 그리지 않음
            bookmarksSet,
          );
        }
      } catch {
        return;
      }
    },
    [overlayMode, bookmarksSet],
  );

  const fetchCommercialData = useCallback(
    async (mapInstance: KakaoMap, shouldClear: boolean) => {
      if (shouldClear) {
        allCommercialFeaturesRef.current = [];
      }

      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const query = new URLSearchParams({
        minx: sw.getLng().toString(),
        miny: sw.getLat().toString(),
        maxx: ne.getLng().toString(),
        maxy: ne.getLat().toString(),
      });
      if (industryParams?.industryCode) {
        query.set('industryCode', industryParams.industryCode);
      }
      if (industryParams?.industryCodes) {
        query.set('industryCodes', industryParams.industryCodes);
      }

      try {
        const url = `${API_ENDPOINTS.POLYGON_COMMERCIAL}?${query}`;
        const response = await fetch(url);
        const data: unknown = await response.json();

        if (Array.isArray(data)) {
          const commercialAreas = (data as CommercialApiResponse[]).map(
            (feature) => ({
              commercialType: feature.properties.commercialType,
              commercialName: feature.properties.commercialName,
              commercialCode:
                feature.code || feature.properties.commercialCode || '',
              guCode: feature.properties.guCode,
              dongCode: feature.properties.dongCode,
              polygons: feature.polygons.coordinates,
              revenue: feature.revenue,
              residentPopulation: feature.residentPopulation,
              openingStores: feature.openingStores,
              closingStores: feature.closingStores,
              rankRevenue: feature.rankRevenue,
              rankPopulation: feature.rankPopulation,
              rankOpening: feature.rankOpening,
              rankClosing: feature.rankClosing,
            }),
          );

          const newCommercialAreas = commercialAreas.filter((area) => {
            if (visitedCommercialRef.current.has(area.commercialName))
              return false;
            visitedCommercialRef.current.add(area.commercialName);
            return true;
          });

          if (newCommercialAreas.length > 0) {
            drawPolygons(
              mapInstance,
              newCommercialAreas,
              'commercial',
              polygonsRef,
              customOverlaysRef,
              (clickedData) => onPolygonClickRef.current(clickedData),
              shouldClear,
              overlayMode,
              'commercial',
              false,
              bookmarksSet,
            );

            allCommercialFeaturesRef.current = [
              ...allCommercialFeaturesRef.current,
              ...newCommercialAreas,
            ] as unknown as CommercialApiResponse[];
          }

          if (commercialAreas.length > 0) {
            drawMarkers(
              mapInstance,
              commercialAreas as unknown as AdminArea[],
              customOverlaysRef,
              (clickedData) => onPolygonClickRef.current(clickedData),
              overlayMode,
              'commercial',
              bookmarksSet,
            );
          }
        }
      } catch {
        return;
      }
    },
    [overlayMode, bookmarksSet, industryParams],
  );

  const refreshLayer = useCallback(
    (mapInstance: KakaoMap) => {
      const level = mapInstance.getLevel();

      let currentGroup = '';
      if (level >= 7) currentGroup = 'GU';
      else if (level >= 5) currentGroup = 'DONG';
      else if (level >= 3) currentGroup = 'COMMERCIAL';
      else currentGroup = 'BUILDING';

      const modeChanged = overlayMode !== lastOverlayModeRef.current;
      const groupChanged = currentGroup !== lastLevelGroupRef.current;
      const industryChanged = industryKey !== lastIndustryKeyRef.current;
      const shouldClear = groupChanged || modeChanged || industryChanged;

      if (shouldClear) {
        visitedCommercialRef.current.clear();
        lastOverlayModeRef.current = overlayMode;
        lastIndustryKeyRef.current = industryKey;
      }
      lastLevelGroupRef.current = currentGroup;

      if (level >= 7) {
        fetchCombinedBoundary(mapInstance, 1);
      } else if (level >= 5) {
        fetchCombinedBoundary(mapInstance, 2);
      } else if (level >= 3) {
        fetchCommercialData(mapInstance, shouldClear);
      } else {
        fetchBuildingData(mapInstance);
      }
    },
    [
      fetchCombinedBoundary,
      fetchBuildingData,
      fetchCommercialData,
      overlayMode,
      industryKey,
    ],
  );

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

    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', debouncedRefresh);
      window.kakao.maps.event.removeListener(
        map,
        'zoom_changed',
        debouncedRefresh,
      );
    };
  }, [map, refreshLayer, overlayMode]);
};
