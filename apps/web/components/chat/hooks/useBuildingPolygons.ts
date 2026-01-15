'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  type KakaoMap,
  type KakaoPolygon,
  type KakaoLatLng,
} from '../../../hooks/useKakaoMap';

// API 환경 변수
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// 건물 폴리곤 응답 타입 (API 응답 구조에 맞춤)
interface BuildingPolygonResponse {
  buld_nm: string; // 건물명
  adm_nm?: string; // 주소
  polygons: number[][][]; // 폴리곤 좌표 배열
}

// 훅 Props
interface UseBuildingPolygonsProps {
  map: KakaoMap | null;
  loaded: boolean;
  zoomThreshold?: number; // 이 줌 레벨 이하일 때 폴리곤 표시 (기본: 3)
  maxPolygons?: number; // 최대 폴리곤 수 (기본: 50)
  onBuildingClick?: (building: {
    id: string;
    name: string;
    polygonWkt: string;
  }) => void;
}

/**
 * useBuildingPolygons 훅
 *
 * - 지도 줌 레벨이 threshold 이하일 때 건물 폴리곤을 로드
 * - 클릭 이벤트를 통해 건물 선택을 부모에게 전달
 */
export function useBuildingPolygons({
  map,
  loaded,
  zoomThreshold = 3,
  maxPolygons = 100, // 성능을 위해 최대 50개로 제한
  onBuildingClick,
}: UseBuildingPolygonsProps) {
  // 현재 렌더링된 폴리곤들 추적
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const isLoadingRef = useRef(false);
  const selectedPolygonRef = useRef<KakaoPolygon | null>(null);
  const selectedPathRef = useRef<KakaoLatLng[] | null>(null); // 선택된 폴리곤의 path 저장
  const selectedBuildingRef = useRef<BuildingPolygonResponse | null>(null); // 선택된 건물 정보
  const selectedOuterRingRef = useRef<number[][] | null>(null); // 선택된 outerRing

  // 폴리곤 클리어
  const clearPolygons = useCallback(() => {
    polygonsRef.current.forEach((polygon) => polygon.setMap(null));
    polygonsRef.current = [];
    selectedPolygonRef.current = null;
    selectedPathRef.current = null;
    selectedBuildingRef.current = null;
    selectedOuterRingRef.current = null;
  }, []);

  // 좌표 배열을 WKT 형식으로 변환 (outerRing 직접 사용)
  const ringToWkt = (ring: number[][]): string => {
    if (!ring || ring.length === 0) return 'POLYGON EMPTY';
    // 첫 포인트를 마지막에 추가하여 폴리곤 닫기
    const closedRing = [...ring];
    if (
      ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1]
    ) {
      closedRing.push(ring[0]);
    }
    const points = closedRing
      .map((coord) => `${coord[0]} ${coord[1]}`)
      .join(', ');
    return `POLYGON((${points}))`;
  };

  // 건물 폴리곤 로드
  const loadBuildingPolygons = useCallback(async () => {
    if (!map || isLoadingRef.current) return;

    const level = map.getLevel();

    // 줌 레벨이 threshold보다 크면 폴리곤 제거
    if (level > zoomThreshold) {
      clearPolygons();
      return;
    }

    isLoadingRef.current = true;

    try {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const params = new URLSearchParams({
        minx: sw.getLng().toString(),
        miny: sw.getLat().toString(),
        maxx: ne.getLng().toString(),
        maxy: ne.getLat().toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/polygon/building?${params}`,
      );
      if (!response.ok) throw new Error('Failed to fetch building polygons');

      const buildings: BuildingPolygonResponse[] = await response.json();

      // 기존 폴리곤 제거
      clearPolygons();

      // 성능을 위해 폴리곤 수 제한 (건물명이 있는 것 우선)
      const validBuildings = buildings
        .filter((b) => b.buld_nm && b.buld_nm !== '건물명 없음') // 건물명 있는 것만
        .slice(0, maxPolygons);

      console.log(
        `[useBuildingPolygons] Rendering ${validBuildings.length}/${buildings.length} polygons (max: ${maxPolygons})`,
      );

      // 새 폴리곤 생성
      validBuildings.forEach((building) => {
        // polygons 필드 확인 (API 응답 구조)
        const polygonData = building.polygons;
        if (
          !polygonData ||
          (Array.isArray(polygonData) && polygonData.length === 0)
        ) {
          console.warn(
            '[useBuildingPolygons] No polygons for building:',
            building.buld_nm,
          );
          return;
        }

        // GeoJSON 좌표 추출 (다양한 형식 처리)
        // MultiPolygon: [[[[lng, lat], ...]], ...] - coords[0][0]
        // Polygon: [[[lng, lat], ...]] - coords[0]
        // 또는 단순 배열: [[lng, lat], ...] - coords
        let outerRing: number[][] | null = null;

        // 깊이에 따라 좌표 추출
        if (Array.isArray(polygonData)) {
          const first = polygonData[0];
          if (Array.isArray(first)) {
            const second = first[0];
            if (Array.isArray(second)) {
              // MultiPolygon or Polygon - [[[]]] or [[[[]]]]
              if (typeof second[0] === 'number') {
                // Polygon: coords[0] = [[lng, lat], ...]
                outerRing = first as unknown as number[][];
              } else {
                // MultiPolygon: coords[0][0] = [[lng, lat], ...]
                outerRing = second as unknown as number[][];
              }
            } else if (typeof second === 'number') {
              // Simple ring: [[lng, lat], ...]
              outerRing = polygonData as unknown as number[][];
            }
          }
        }

        if (!outerRing || outerRing.length === 0) {
          console.warn(
            '[useBuildingPolygons] Could not extract outer ring for:',
            building.buld_nm,
          );
          return;
        }

        // outerRing을 kakao.maps.LatLng 배열로 변환 (lng, lat -> lat, lng)
        const path = outerRing.map(
          (coord) => new window.kakao.maps.LatLng(coord[1], coord[0]),
        );

        const polygon = new window.kakao.maps.Polygon({
          path: path,
          strokeWeight: 2,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          fillColor: '#3B82F6',
          fillOpacity: 0.2,
        });

        polygon.setMap(map);
        polygonsRef.current.push(polygon);

        // 마우스 호버 효과
        window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
          if (selectedPolygonRef.current !== polygon) {
            // 선택되지 않은 폴리곤만 호버 효과
            const newPolygon = new window.kakao.maps.Polygon({
              path: path,
              strokeWeight: 3,
              strokeColor: '#2563EB',
              strokeOpacity: 1,
              fillColor: '#3B82F6',
              fillOpacity: 0.4,
            });
            polygon.setMap(null);
            newPolygon.setMap(map);

            // 참조 업데이트
            const idx = polygonsRef.current.indexOf(polygon);
            if (idx !== -1) polygonsRef.current[idx] = newPolygon;

            // 마우스 아웃 시 복원
            window.kakao.maps.event.addListener(newPolygon, 'mouseout', () => {
              if (selectedPolygonRef.current !== newPolygon) {
                const originalPolygon = new window.kakao.maps.Polygon({
                  path: path,
                  strokeWeight: 2,
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.8,
                  fillColor: '#3B82F6',
                  fillOpacity: 0.2,
                });
                newPolygon.setMap(null);
                originalPolygon.setMap(map);

                const i = polygonsRef.current.indexOf(newPolygon);
                if (i !== -1) polygonsRef.current[i] = originalPolygon;

                // 새 폴리곤에도 이벤트 다시 등록
                setupPolygonEvents(originalPolygon, building, path, outerRing);
              }
            });

            // 새 폴리곤에 클릭 이벤트 등록
            window.kakao.maps.event.addListener(newPolygon, 'click', () => {
              handlePolygonClick(newPolygon, building, path, outerRing);
            });
          }
        });

        // 클릭 이벤트
        window.kakao.maps.event.addListener(polygon, 'click', () => {
          handlePolygonClick(polygon, building, path, outerRing);
        });
      });

      // 폴리곤 클릭 핸들러
      function handlePolygonClick(
        polygon: KakaoPolygon,
        building: BuildingPolygonResponse,
        path: KakaoLatLng[],
        outerRing: number[][],
      ) {
        console.log(
          '[useBuildingPolygons] Building clicked:',
          building.buld_nm,
        );

        // 이전 선택된 폴리곤이 있으면 기본 스타일로 복원 (삭제 X)
        if (selectedPolygonRef.current && selectedPathRef.current) {
          const prevPolygon = selectedPolygonRef.current;
          const prevPath = selectedPathRef.current;
          const prevBuilding = selectedBuildingRef.current;
          const prevOuterRing = selectedOuterRingRef.current;
          prevPolygon.setMap(null);
          
          // 기본 스타일의 폴리곤으로 교체
          const restoredPolygon = new window.kakao.maps.Polygon({
            path: prevPath,
            strokeWeight: 2,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
          });
          restoredPolygon.setMap(map);
          
          // 복원된 폴리곤에 클릭 이벤트 다시 등록
          if (prevBuilding && prevOuterRing) {
            window.kakao.maps.event.addListener(restoredPolygon, 'click', () => {
              handlePolygonClick(restoredPolygon, prevBuilding, prevPath, prevOuterRing);
            });
          }
          
          // polygonsRef에서 이전 선택 폴리곤을 복원된 폴리곤으로 교체
          const prevIdx = polygonsRef.current.indexOf(prevPolygon);
          if (prevIdx !== -1) {
            polygonsRef.current[prevIdx] = restoredPolygon;
          } else {
            polygonsRef.current.push(restoredPolygon);
          }
        }

        // 새로운 선택 폴리곤 강조
        const selectedPolygon = new window.kakao.maps.Polygon({
          path: path,
          strokeWeight: 4,
          strokeColor: '#8B5CF6',
          strokeOpacity: 1,
          fillColor: '#8B5CF6',
          fillOpacity: 0.5,
        });
        polygon.setMap(null);
        selectedPolygon.setMap(map);

        const idx = polygonsRef.current.indexOf(polygon);
        if (idx !== -1) polygonsRef.current[idx] = selectedPolygon;
        
        // 선택 상태 저장
        selectedPolygonRef.current = selectedPolygon;
        selectedPathRef.current = path;
        selectedBuildingRef.current = building;
        selectedOuterRingRef.current = outerRing;

        // 선택된 폴리곤에도 클릭 이벤트 등록 (다시 클릭 가능하도록)
        window.kakao.maps.event.addListener(selectedPolygon, 'click', () => {
          handlePolygonClick(selectedPolygon, building, path, outerRing);
        });

        // outerRing을 직접 사용하여 WKT 생성
        const wkt = ringToWkt(outerRing);
        console.log(
          '[useBuildingPolygons] Generated WKT with',
          outerRing.length,
          'points',
        );

        onBuildingClick?.({
          id: building.buld_nm,
          name: building.buld_nm || '건물',
          polygonWkt: wkt,
        });
      }

      // 폴리곤 이벤트 설정 함수 (재사용용)
      function setupPolygonEvents(
        polygon: KakaoPolygon,
        building: BuildingPolygonResponse,
        path: KakaoLatLng[],
        outerRing: number[][],
      ) {
        window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
          if (selectedPolygonRef.current !== polygon) {
            const hoverPolygon = new window.kakao.maps.Polygon({
              path: path,
              strokeWeight: 3,
              strokeColor: '#2563EB',
              strokeOpacity: 1,
              fillColor: '#3B82F6',
              fillOpacity: 0.4,
            });
            polygon.setMap(null);
            hoverPolygon.setMap(map);
            const i = polygonsRef.current.indexOf(polygon);
            if (i !== -1) polygonsRef.current[i] = hoverPolygon;
            setupPolygonEvents(hoverPolygon, building, path, outerRing);
          }
        });

        window.kakao.maps.event.addListener(polygon, 'click', () => {
          handlePolygonClick(polygon, building, path, outerRing);
        });
      }

      console.log(
        `[useBuildingPolygons] Loaded ${buildings.length} building polygons`,
      );
    } catch (error) {
      console.error('[useBuildingPolygons] Error loading polygons:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [map, zoomThreshold, maxPolygons, clearPolygons, onBuildingClick]);

  // 지도 이벤트 리스너 등록
  useEffect(() => {
    if (!map || !loaded) return;

    // 초기 로드
    loadBuildingPolygons();

    // 줌/이동 이벤트에 debounce 적용
    let timeoutId: NodeJS.Timeout;
    const handleMapChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(loadBuildingPolygons, 300);
    };

    window.kakao.maps.event.addListener(map, 'idle', handleMapChange);

    return () => {
      clearTimeout(timeoutId);
      window.kakao.maps.event.removeListener(map, 'idle', handleMapChange);
      clearPolygons();
    };
  }, [map, loaded, loadBuildingPolygons, clearPolygons]);

  return { clearPolygons };
}
