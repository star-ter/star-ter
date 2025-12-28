import { useEffect, useState, useCallback, useRef } from 'react';
import { KakaoMap, KakaoPolygon, KakaoLatLng } from '../types/map-types';
import {
  PopulationRow,
  GenderFilter,
  AgeFilter,
} from '../types/population-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface CombinedFeature {
  cell_id: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  population: PopulationRow;
  center?: { lat: number; lng: number };
}

interface CombinedLayerResponse {
  ymd: string;
  tt: string;
  features: CombinedFeature[];
}

export const usePopulationLayer = (
  map: KakaoMap | null,
  _populationData: PopulationRow[],
  genderFilter: GenderFilter,
  ageFilter: AgeFilter,
  isVisible: boolean,
  getPopulationValue: (
    row: PopulationRow,
    gender: GenderFilter,
    age: AgeFilter,
  ) => number,
  getColorByValue: (value: number, max: number) => string,
) => {
  const [features, setFeatures] = useState<CombinedFeature[]>([]);
  const featuresMapRef = useRef<Map<string, CombinedFeature>>(new Map());
  const polygonsRef = useRef<Map<string, KakaoPolygon>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 데이터 로드 함수
  const fetchData = useCallback((currentMap: KakaoMap) => {
    if (!isVisible) return;
    
    const bounds = currentMap.getBounds();
    if (!bounds || typeof bounds.getSouthWest !== 'function') return;

    const currentZoom = currentMap.getLevel();
    if (currentZoom > 6) return; // 줌이 너무 높으면 요청 안함

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // 이전 요청 취소 (빠른 이동 시 부하 방지)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const params = new URLSearchParams({
      minLat: sw.getLat().toString(),
      minLng: sw.getLng().toString(),
      maxLat: ne.getLat().toString(),
      maxLng: ne.getLng().toString(),
    });

    fetch(`${API_BASE_URL}/floating-population/layer?${params.toString()}`, {
      signal: abortControllerRef.current.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: CombinedLayerResponse) => {
        if (!isVisible) return; // 요청 완료 시점에 꺼져있으면 무시
        
        let hasNew = false;
        
        data.features.forEach((f) => {
          if (!featuresMapRef.current.has(f.cell_id)) {
            // 중심점 계산
            const geometry = f.geometry;
            let firstCoord: number[] | null = null;
            try {
              if (geometry.type === 'Polygon') {
                firstCoord = geometry.coordinates[0]?.[0] as number[];
              } else if (geometry.type === 'MultiPolygon') {
                firstCoord = geometry.coordinates[0]?.[0]?.[0] as number[];
              }
            } catch {}

            if (firstCoord && firstCoord[0] && firstCoord[1]) {
              f.center = { lng: firstCoord[0], lat: firstCoord[1] };
            }
            
            featuresMapRef.current.set(f.cell_id, f);
            hasNew = true;
          }
        });

        // 성능을 위해 캐시가 너무 커지면 오래된 것 정리 (Optional, 5000개 정도 유지)
        if (featuresMapRef.current.size > 5000) {
           const iterator = featuresMapRef.current.keys();
           for(let i=0; i<1000; i++) {
             const key = iterator.next().value;
             if (key) featuresMapRef.current.delete(key);
           }
        }

        if (hasNew) {
          setFeatures(Array.from(featuresMapRef.current.values()));
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Layer Load Error:', err);
      });
  }, [isVisible]);

  // 초기 로드
  useEffect(() => {
    if (map && isVisible) {
      fetchData(map);
    }
  }, [map, fetchData, isVisible]);

  // 렌더링 엔진
  const renderLayer = useCallback(() => {
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) return;
    if (!map) return;

    // 가시성 꺼져있으면 정리하고 종료
    if (!isVisible) {
      polygonsRef.current.forEach((p) => p.setMap(null));
      polygonsRef.current.clear();
      return;
    }

    const bounds = map.getBounds();
    if (!bounds || typeof bounds.getSouthWest !== 'function') return;

    const currentZoom = map.getLevel();

    // 줌 레벨 제한
    if (currentZoom > 6) {
      polygonsRef.current.forEach((p) => p.setMap(null));
      polygonsRef.current.clear();
      return;
    }

    if (features.length === 0) return;

    // 인구수 최대값 계산
    const values = features.map((f) =>
      getPopulationValue(f.population, genderFilter, ageFilter),
    );
    const maxValue = Math.max(...values, 1);

    // [Step A] 가시 영역 결정 (현재 화면보다 약간 더 넓게 잡아 '끈적이는' 효과 부여)
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latBuffer = (ne.getLat() - sw.getLat()) * 0.5; // 화면 높이의 50% 버퍼
    const lngBuffer = (ne.getLng() - sw.getLng()) * 0.5; // 화면 너비의 50% 버퍼

    const extendedBounds = new window.kakao.maps.LatLngBounds(
      new window.kakao.maps.LatLng(sw.getLat() - latBuffer, sw.getLng() - lngBuffer),
      new window.kakao.maps.LatLng(ne.getLat() + latBuffer, ne.getLng() + lngBuffer)
    );

    const visibleCellIds = new Set<string>();
    features.forEach((f) => {
      if (!f.center) return;
      const pos = new window.kakao.maps.LatLng(f.center.lat, f.center.lng);
      if (extendedBounds.contain(pos)) {
        visibleCellIds.add(f.cell_id);
      }
    });

    // [Step B] 성능을 위해 너무 많은 폴리곤이 쌓였을 때만 정리 (화면 아주 멀리 나간 것들)
    if (polygonsRef.current.size > 1500) {
      const currentPolygons = polygonsRef.current;
      let deleteCount = 0;
      currentPolygons.forEach((polygon, cellId) => {
        if (!visibleCellIds.has(cellId) && deleteCount < 500) {
          polygon.setMap(null);
          currentPolygons.delete(cellId);
          deleteCount++;
        }
      });
    }

    // [Step C] 화면 안 격자 그리기/업데이트
    features.forEach((f) => {
      // 화면 밖 영역(버퍼 포함)의 데이터는 굳이 새로 그리지 않음
      if (!visibleCellIds.has(f.cell_id)) return;

      const value = getPopulationValue(f.population, genderFilter, ageFilter);
      const color = getColorByValue(value, maxValue);

      if (polygonsRef.current.has(f.cell_id)) {
        const polygon = polygonsRef.current.get(f.cell_id)!;
        if (polygon.fillColor === color) return;

        polygon.setOptions({
          fillColor: color,
          strokeColor: color,
        });
        polygon.fillColor = color;
        return;
      }

      // 신규 생성
      const paths: KakaoLatLng[][] = [];
      const geometry = f.geometry;
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
        strokeWeight: 0.5,
        strokeColor: color,
        strokeOpacity: 0.6,
        fillColor: color,
        fillOpacity: 0.6,
      });

      polygon.setMap(map);
      polygonsRef.current.set(f.cell_id, polygon);
    });
  }, [map, features, genderFilter, ageFilter, isVisible, getPopulationValue, getColorByValue]);

  // 맵 이벤트 바인딩
  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    if (!map || !kakaoMaps?.event) return;

    if (!isVisible) {
      // 끄기 상태일 때 기존 리스너 cleanup 및 폴리곤 제거
      polygonsRef.current.forEach(p => p.setMap(null));
      polygonsRef.current.clear();
      return;
    }

    const eventApi = kakaoMaps.event;
    let idleListener: unknown = null;
    let zoomListener: unknown = null;
    const polygons = polygonsRef.current;

    renderLayer();

    try {
      idleListener = eventApi.addListener(map, 'idle', () => {
        // 이미 가지고 있는 데이터로 먼저 그림
        renderLayer(); 
        
        // 디바운스 적용: 300ms 동안 멈춰있을 때만 fetchData 호출
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          fetchData(map);
        }, 300);
      });
      zoomListener = eventApi.addListener(map, 'zoom_changed', renderLayer);
    } catch (e) {
      console.error('Failed to add map listeners', e);
    }

    return () => {
        try {
            if (idleListener && eventApi.removeListener) eventApi.removeListener(idleListener);
            if (zoomListener && eventApi.removeListener) eventApi.removeListener(zoomListener);
        } catch {}

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (polygons) {
            polygons.forEach(p => p.setMap(null));
            polygons.clear();
        }
    };
  }, [map, renderLayer, fetchData, isVisible]);

  return { geoJsonLoaded: features.length > 0 };
};