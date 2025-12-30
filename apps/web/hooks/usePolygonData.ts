import { useRef, useEffect, useCallback } from 'react';
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
import { useMapStore } from '../stores/useMapStore';
import { API_ENDPOINTS } from '../config/api';

export const usePolygonData = (
  map: KakaoMap | null,
  onPolygonClick: (data: InfoBarData) => void,
) => {
  // 1. Store hooks
  const { overlayMode } = useMapStore();

  // 2. Refs
  const lastLevelGroupRef = useRef<string | null>(null);
  const lastOverlayModeRef = useRef<string>('revenue');
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const onPolygonClickRef = useRef(onPolygonClick);
  const visitedCommercialRef = useRef<Set<string>>(new Set());

  // 3. Effects (Sync Props)
  useEffect(() => {
    onPolygonClickRef.current = onPolygonClick;
  }, [onPolygonClick]);

  // 4. Callbacks
  const fetchCombinedBoundary = useCallback(
    async (mapInstance: KakaoMap, lowSearch: number) => {
      try {
        const url = `${API_ENDPOINTS.POLYGON_ADMIN}?low_search=${lowSearch}`;
        const response = await fetch(url);
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
          );
        }
      } catch (err) {
        console.error('Combined Boundary Fetch Error:', err);
      }
    },
    [overlayMode],
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
          );
        }
      } catch (err) {
        console.error('Building API Fetch Error:', err);
      }
    },
    [overlayMode],
  );

  const fetchCommercialData = useCallback(
    async (mapInstance: KakaoMap) => {
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const query = new URLSearchParams({
        minx: sw.getLng().toString(),
        miny: sw.getLat().toString(),
        maxx: ne.getLng().toString(),
        maxy: ne.getLat().toString(),
      });

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
              false,
              overlayMode,
            );
          }
        }
      } catch (err) {
        console.error('Commercial API Fetch Error:', err);
      }
    },
    [overlayMode],
  );

  const refreshLayer = useCallback(
    (mapInstance: KakaoMap) => {
      const level = mapInstance.getLevel();

      let currentGroup = '';
      if (level >= 7) currentGroup = 'GU';
      else if (level >= 5) currentGroup = 'DONG';
      else if (level >= 2) currentGroup = 'COMMERCIAL';
      else currentGroup = 'BUILDING';

      const modeChanged = overlayMode !== lastOverlayModeRef.current;

      if (currentGroup !== lastLevelGroupRef.current || modeChanged) {
        polygonsRef.current.forEach((polygon) => {
          polygon.setMap(null);
        });
        polygonsRef.current = [];
        customOverlaysRef.current.forEach((overlay) => {
          overlay.setMap(null);
        });
        customOverlaysRef.current = [];
        visitedCommercialRef.current.clear();

        lastOverlayModeRef.current = overlayMode;
      }

      if (
        currentGroup === lastLevelGroupRef.current &&
        !modeChanged &&
        (currentGroup === 'GU' || currentGroup === 'DONG')
      ) {
        return;
      }

      lastLevelGroupRef.current = currentGroup;

      if (level >= 7) {
        fetchCombinedBoundary(mapInstance, 1);
      } else if (level >= 5) {
        fetchCombinedBoundary(mapInstance, 2);
      } else if (level >= 2) {
        fetchCommercialData(mapInstance);
      } else {
        fetchBuildingData(mapInstance);
      }
    },
    [fetchCombinedBoundary, fetchBuildingData, fetchCommercialData, overlayMode],
  );

  // 5. Main Effect
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