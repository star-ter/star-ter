import { useEffect, useState, useCallback, useRef } from 'react';
import { KakaoMap, KakaoPolygon, KakaoLatLng } from '../types/map-types';
import {
  PopulationRow,
  GenderFilter,
  AgeFilter,
} from '../types/population-types';


interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    CELL_ID: string;
    [key: string]: string | number | undefined;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  // 중심점 미리 보관용
  center: { lat: number; lng: number };
}

interface GridGeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export const usePopulationLayer = (
  map: KakaoMap | null,
  populationData: PopulationRow[],
  genderFilter: GenderFilter,
  ageFilter: AgeFilter,
  getPopulationValue: (
    row: PopulationRow,
    gender: GenderFilter,
    age: AgeFilter,
  ) => number,
  getColorByValue: (value: number, max: number) => string,
) => {
  const [geoJson, setGeoJson] = useState<GridGeoJSON | null>(null);
  const polygonsRef = useRef<Map<string, KakaoPolygon>>(new Map());
  const featureMapRef = useRef<Map<string, GeoJSONFeature>>(new Map());

  // GeoJSON 데이터 로드 및 전처리 (중심점 계산)
  useEffect(() => {
    fetch('/data/seoul_grid_250m.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: GridGeoJSON) => {
        const fMap = new Map<string, GeoJSONFeature>();
        data.features.forEach((f) => {
          // 격자의 대략적인 중심점 추출 (안전한 접근)
          const geometry = f.geometry;
          let firstCoord: number[] | null = null;
          
          try {
            if (geometry.type === 'Polygon') {
              firstCoord = geometry.coordinates[0]?.[0] as number[];
            } else if (geometry.type === 'MultiPolygon') {
              firstCoord = geometry.coordinates[0]?.[0]?.[0] as number[];
            }
          } catch {
            console.warn('Invalid geometry for cell:', f.properties.CELL_ID);
          }
          
          if (firstCoord && firstCoord[0] && firstCoord[1]) {
            f.center = { lng: firstCoord[0], lat: firstCoord[1] };
            fMap.set(f.properties.CELL_ID, f);
          }
        });
        featureMapRef.current = fMap;
        setGeoJson(data);
      })
      .catch((err) => console.error('Grid GeoJSON Load Error:', err));
  }, []);

  // 렌더링 엔진 (Viewport 기반 Lazy Rendering)
  const renderLayer = useCallback(() => {
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) return;
    if (!map || !geoJson || !populationData || populationData.length === 0) return;

    const bounds = map.getBounds();
    if (!bounds || typeof bounds.getSouthWest !== 'function') return;

    const currentZoom = map.getLevel();

    // 줌 레벨 제한 (사용자 의도 레벨 6~7 반영)
    if (currentZoom > 5) {
      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
      polygonsRef.current.clear();
      return;
    }

    // 인구수 최대값 계산 (색상 스케일용)
    const values = populationData.map((row) =>
      getPopulationValue(row, genderFilter, ageFilter),
    );
    const maxValue = Math.max(...values, 1);

    // [Step A] 현재 화면 안에 들어와야 할 격자 필터링
    const visibleCellIds = new Set<string>();
    populationData.forEach((row) => {
      const feature = featureMapRef.current.get(row.CELL_ID);
      if (!feature || !feature.center) return;

      const pos = new window.kakao.maps.LatLng(feature.center.lat, feature.center.lng);
      
      // Kakao API의 LatLngBounds는 'contain' 메서드를 사용합니다. (s 없음)
      const isVisible = bounds.contain(pos);

      if (isVisible) {
        visibleCellIds.add(row.CELL_ID);
      }
    });

    // 화면 밖으로 나간 폴리곤만 제거 (Diff 처리)
    polygonsRef.current.forEach((polygon, cellId) => {
      if (!visibleCellIds.has(cellId)) {
        polygon.setMap(null);
        polygonsRef.current.delete(cellId);
      }
    });

    // 화면 안의 폴리곤 그리기 (기존 것은 유지, 없는 것만 생성)
    populationData.forEach((row) => {
      if (!visibleCellIds.has(row.CELL_ID)) return;
      if (polygonsRef.current.has(row.CELL_ID)) return; // 이미 그려져 있으면 건너뜀

      const feature = featureMapRef.current.get(row.CELL_ID);
      if (!feature) return;

      const value = getPopulationValue(row, genderFilter, ageFilter);
      const color = getColorByValue(value, maxValue);

      const paths: KakaoLatLng[][] = [];
      const geometry = feature.geometry;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates as number[][][];
        if (coords[0]) {
          paths.push(coords[0].map(c => new window.kakao.maps.LatLng(c[1], c[0])));
        }
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates as number[][][][];
        coords.forEach(poly => {
          if (poly[0]) {
            paths.push(poly[0].map(c => new window.kakao.maps.LatLng(c[1], c[0])));
          }
        });
      }

      const polygon = new window.kakao.maps.Polygon({
        path: paths,
        strokeWeight: 0.5, // 얇은 선으로 경계 구분 (가시성 확보)
        strokeColor: color,
        strokeOpacity: 0.5,
        fillColor: color,
        fillOpacity: 0.5, // 가시성을 위해 투명도 상향
      });

      polygon.setMap(map);
      polygonsRef.current.set(row.CELL_ID, polygon);
    });
  }, [map, geoJson, populationData, genderFilter, ageFilter, getPopulationValue, getColorByValue]);

  // 맵 이벤트 바인딩 (지도가 멈출 때만 실행)
  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    if (!map || !kakaoMaps?.event) return;

    const eventApi = kakaoMaps.event;
    let idleListener: unknown = null;
    
    // 데이터 로드 시 초기 렌더링
    renderLayer();

    try {
      idleListener = eventApi.addListener(map, 'idle', renderLayer);
    } catch {
      console.error('Failed to add map listener');
    }

    // 가비지 컬렉션을 위해 현재 맵에 그려진 모든 객체 제거
    const currentPolygons = polygonsRef.current;

    return () => {
      try {
        if (idleListener && eventApi && typeof eventApi.removeListener === 'function') {
          eventApi.removeListener(idleListener);
        }
      } catch {
        // 내부 API 트리 구조가 이미 해제된 경우 발생할 수 있음
        console.debug('Safe cleanup: Listener already removed or map destroyed');
      }
      
      if (currentPolygons) {
        currentPolygons.forEach((polygon) => {
          try {
            polygon.setMap(null);
          } catch {}
        });
        currentPolygons.clear();
      }
    };
  }, [map, renderLayer]);

  return { geoJsonLoaded: !!geoJson };
};