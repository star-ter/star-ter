import { useEffect, useState, useCallback, useRef } from 'react';
import { KakaoMap, KakaoLatLng } from '../types/map-types';
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
  genderFilter: GenderFilter,
  ageFilter: AgeFilter,
  isVisible: boolean,
  getPopulationValue: (
    row: PopulationRow,
    gender: GenderFilter,
    age: AgeFilter,
  ) => number,
) => {
  const [features, setFeatures] = useState<CombinedFeature[]>([]);
  const featuresMapRef = useRef<Map<string, CombinedFeature>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const featuresRef = useRef<CombinedFeature[]>([]);

  // features 데이터가 바뀔 때마다 Ref 업데이트 (이벤트 리스너가 최신 데이터를 보게 함)
  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  // 데이터 로드 함수
  const fetchData = useCallback(
    (currentMap: KakaoMap) => {
      if (!isVisible) return;

      const currentZoom = currentMap.getLevel();
      // 연무 모드 타겟(3,4,5) 근처에서만 데이터를 가져오도록 제한
      if (currentZoom > 6) return; 

      const bounds = currentMap.getBounds();
      if (!bounds || typeof bounds.getSouthWest !== 'function') return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

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
          if (!res.ok) return null;
          return res.json();
        })
        .then((data: CombinedLayerResponse) => {
          if (!data || !isVisible) return;

          let hasNew = false;
          const newMap = new Map<string, CombinedFeature>(featuresMapRef.current);

          data.features.forEach((f) => {
            if (!newMap.has(f.cell_id)) {
              const geometry = f.geometry;
              if (geometry.type === 'Polygon' && geometry.coordinates[0]?.[0]) {
                const coord = geometry.coordinates[0][0] as number[];
                f.center = { lng: coord[0], lat: coord[1] };
              } else if (geometry.type === 'MultiPolygon' && geometry.coordinates[0]?.[0]?.[0]) {
                const coord = geometry.coordinates[0][0][0] as number[];
                f.center = { lng: coord[0], lat: coord[1] };
              }
              newMap.set(f.cell_id, f);
              hasNew = true;
            }
          });

          if (newMap.size > 8000) {
            const iterator = newMap.keys();
            for (let i = 0; i < 2000; i++) {
              const key = iterator.next().value;
              if (key) newMap.delete(key);
            }
            hasNew = true;
          }

          if (hasNew) {
            featuresMapRef.current = newMap;
            setFeatures(Array.from(newMap.values()));
          }
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
        });
    },
    [isVisible],
  );

  // 초기 로드
  useEffect(() => {
    if (map && isVisible) {
      fetchData(map);
    }
  }, [map, fetchData, isVisible]);

  // 히트맵 컬러 팔레트를 미리 계산하여 성능 향상
  const colorPalette = (function() {
    const palette = new Uint8ClampedArray(256 * 3);
    const gradient = [
      { stop: 0, color: [10, 10, 50] },       // 거의 안 보이는 어두운 남색
      { stop: 60, color: [0, 100, 255] },     // 여기서부터 본격적인 Blue
      { stop: 110, color: [0, 220, 200] },    // Teal/Cyan
      { stop: 170, color: [255, 230, 0] },    // Bright Yellow/Gold
      { stop: 230, color: [255, 100, 0] },    // Deep Orange
      { stop: 255, color: [255, 255, 255] },  // White Hot
    ];

    for (let alpha = 0; alpha < 256; alpha++) {
      let found = false;
      for (let i = 0; i < gradient.length - 1; i++) {
        if (alpha >= gradient[i].stop && alpha <= gradient[i + 1].stop) {
          const ratio = (alpha - gradient[i].stop) / (gradient[i + 1].stop - gradient[i].stop);
          palette[alpha * 3] = Math.round(gradient[i].color[0] + (gradient[i + 1].color[0] - gradient[i].color[0]) * ratio);
          palette[alpha * 3 + 1] = Math.round(gradient[i].color[1] + (gradient[i + 1].color[1] - gradient[i].color[1]) * ratio);
          palette[alpha * 3 + 2] = Math.round(gradient[i].color[2] + (gradient[i + 1].color[2] - gradient[i].color[2]) * ratio);
          found = true;
          break;
        }
      }
      if (!found) {
        palette[alpha * 3] = 255;
        palette[alpha * 3 + 1] = 0;
        palette[alpha * 3 + 2] = 0;
      }
    }
    return palette;
  })();

  const dragStartLatLngRef = useRef<KakaoLatLng | null>(null);
  const dragStartCanvasPosRef = useRef<{x: number, y: number} | null>(null);

  // 렌더링 엔진 (Canvas 기반 히트맵)
  const renderLayer = useCallback(() => {
    try {
      const container = document.getElementById('kakao-map') || document.getElementById('map');
      if (!map || !container || !isVisible) {
        const existing = document.getElementById('population-heatmap-canvas');
        if (existing) {
          const ctx = (existing as HTMLCanvasElement).getContext('2d');
          ctx?.clearRect(0, 0, (existing as HTMLCanvasElement).width, (existing as HTMLCanvasElement).height);
        }
        return;
      }

      const currentZoom = map.getLevel();
      const currentFeatures = featuresRef.current;
      if (currentZoom < 2 || currentZoom > 3 || currentFeatures.length === 0) {
        const existing = document.getElementById('population-heatmap-canvas');
        if (existing) {
          const ctx = (existing as HTMLCanvasElement).getContext('2d');
          ctx?.clearRect(0, 0, (existing as HTMLCanvasElement).width, (existing as HTMLCanvasElement).height);
        }
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projection = (map as any).getProjection();
      if (!projection) return;

      const CANVAS_ID = 'population-heatmap-canvas';
      let canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = CANVAS_ID;
        canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;z-index:100;pointer-events:none;';
        container.appendChild(canvas);
      }
      canvasRef.current = canvas;

      const width = container.offsetWidth;
      const height = container.offsetHeight;
      if (width <= 0 || height <= 0) return;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // 렌더링 시점에 transform 초기화
      canvas.style.transform = 'translate(0, 0)';

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      const values = currentFeatures.map((f: CombinedFeature) =>
        getPopulationValue(f.population, genderFilter, ageFilter),
      );
      const maxValue = values.length > 0 ? Math.max(...values, 1) : 1;
      
      const configMap: Record<number, { radius: number; intensity: number; points: number; spread: number }> = {
        2: { radius: 18, intensity: 2.2, points: 220, spread: 350 }, // 300 -> 220 최적화
        3: { radius: 25, intensity: 1.6, points: 120, spread: 220 }, // 180 -> 120 최적화
      };
      const config = configMap[currentZoom] || { radius: 100, intensity: 0.8, points: 1, spread: 0 };
      
      let drawnCount = 0;
      currentFeatures.forEach((f: CombinedFeature) => {
        if (!f.center) return;
        
        try {
          const latlng = new window.kakao.maps.LatLng(f.center.lat, f.center.lng);
          const pos = projection.containerPointFromCoords(latlng);
          if (!pos || isNaN(pos.x) || isNaN(pos.y)) return;

          // 격자 정렬 느낌을 지우기 위한 전체적인 미세 지터(jitter) 추가
          let cellHash = 0;
          for (let j = 0; j < f.cell_id.length; j++) {
            cellHash = ((cellHash << 5) - cellHash) + f.cell_id.charCodeAt(j);
            cellHash |= 0;
          }
          const globalX = (Math.abs(cellHash) % 30) - 15;
          const globalY = (Math.abs(cellHash * 3) % 30) - 15;
          const baseX = pos.x + globalX;
          const baseY = pos.y + globalY;

          const value = getPopulationValue(f.population, genderFilter, ageFilter);
          const weight = value / maxValue;
          if (weight <= 0.0001) return;

          // 회오리 무늬 박멸 및 밀도별 동적 스케일링 적용
          const dynamicPoints = currentZoom <= 3 ? Math.max(80, Math.floor(config.points * (0.6 + weight * 0.4))) : config.points;
          
          for (let i = 0; i < dynamicPoints; i++) {
            let px = baseX;
            let py = baseY;
            
            // 패턴 방지를 위한 결정론적 카오틱 해시 (Deterministic Chaotic Hash)
            const seedA = cellHash + i * 1337.5;
            const seedB = cellHash + i * 2187.3;
            
            if (i > 0) {
              // 규칙성이 전혀 없는 무작위 각도와 거리 확보
              const randomAngle = (Math.abs(Math.sin(seedA) * 10000) % 1) * Math.PI * 2;
              const randomDist = (Math.abs(Math.cos(seedB) * 10000) % 1) * config.spread;
              px += Math.cos(randomAngle) * randomDist;
              py += Math.sin(randomAngle) * randomDist;
            }

            // 요청하신 디테일: 밀집도가 높은 곳은 크고, 적은 곳은 작게 (Dynamic Radius)
            // 밀도(weight)에 따라 0.5배에서 2.0배까지 크기를 동적으로 변화시킴
            const baseScale = 0.5 + weight * 1.5; 
            const variance = 1 + ((Math.abs(Math.sin(seedA * 3)) % 1) * 0.3 - 0.15); // ±15% 변동성
            const currentRadius = config.radius * baseScale * variance;
            
            // 밀도에 따른 강도 보정 (작은 점도 잘 보이도록)
            const intensityAlpha = Math.min(weight * config.intensity * (0.8 + (1 - baseScale) * 0.5), 0.5);

            const grad = ctx.createRadialGradient(px, py, 0, px, py, currentRadius);
            if (currentZoom <= 3) {
              grad.addColorStop(0, `rgba(0,0,0,${intensityAlpha})`);
              grad.addColorStop(0.4, `rgba(0,0,0,${intensityAlpha * 0.4})`);
              grad.addColorStop(1, 'rgba(0,0,0,0)');
            } else {
              grad.addColorStop(0, `rgba(0,0,0,${Math.min(weight * config.intensity, 0.6)})`);
              grad.addColorStop(0.5, `rgba(0,0,0,${Math.min(weight * config.intensity * 0.3, 0.2)})`);
              grad.addColorStop(1, 'rgba(0,0,0,0)');
            }
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            drawnCount++;
          }
        } catch {
          // 개별 포인트 렌더링 오류 무시
        }
      });

      if (drawnCount > 0) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          // 문턱값을 거의 0에 가깝게 낮춰서 격자 사이의 아주 흐릿한 경계선도 모두 연결함
          if (alpha > 3) {
            const baseIdx = alpha * 3;
            data[i] = colorPalette[baseIdx];
            data[i + 1] = colorPalette[baseIdx + 1];
            data[i + 2] = colorPalette[baseIdx + 2];
            data[i + 3] = alpha * 0.8; // 부드러움을 극대화
          } else {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    } catch (e) {
      // Fail silently
    }
  }, [map, isVisible, genderFilter, ageFilter, getPopulationValue, colorPalette]);

  // [트리거] 데이터 업데이트
  useEffect(() => {
    if (isVisible && features.length > 0) {
      renderLayer();
    }
  }, [features, isVisible, renderLayer]);

  // 맵 이벤트 바인딩
  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    if (!map || !kakaoMaps?.event) return;

    if (!isVisible) {
      const existing = document.getElementById('population-heatmap-canvas');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      canvasRef.current = null;
      return;
    }

    const eventApi = kakaoMaps.event;
    let idleListener: unknown = null;
    let zoomListener: unknown = null;
    let dragStartListener: unknown = null;
    let dragListener: unknown = null;

    renderLayer();

    try {
      idleListener = eventApi.addListener(map, 'idle', () => {
        // 드래그 종료 후 정밀 렌더링
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.style.transform = 'translate(0px, 0px)';
        }
        renderLayer(); 
        
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          fetchData(map);
        }, 300);
      });

      zoomListener = eventApi.addListener(map, 'zoom_changed', () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.style.transform = 'translate(0px, 0px)';
        }
        renderLayer();
      });

      dragStartListener = eventApi.addListener(map, 'dragstart', () => {
        const center = map.getCenter();
        dragStartLatLngRef.current = center;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projection = (map as any).getProjection();
        const pos = projection.containerPointFromCoords(center);
        dragStartCanvasPosRef.current = { x: pos.x, y: pos.y };
      });

      dragListener = eventApi.addListener(map, 'drag', () => {
        const canvas = canvasRef.current;
        if (!canvas || !dragStartLatLngRef.current || !dragStartCanvasPosRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projection = (map as any).getProjection();
        const currentPos = projection.containerPointFromCoords(dragStartLatLngRef.current);
        
        const dx = currentPos.x - dragStartCanvasPosRef.current.x;
        const dy = currentPos.y - dragStartCanvasPosRef.current.y;

        canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    } catch (e) {
      console.error('Failed to add map listeners', e);
    }

    return () => {
        try {
            if (idleListener) eventApi.removeListener(idleListener);
            if (zoomListener) eventApi.removeListener(zoomListener);
            if (dragStartListener) eventApi.removeListener(dragStartListener);
            if (dragListener) eventApi.removeListener(dragListener);
        } catch {}
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [map, renderLayer, fetchData, isVisible]);

  return { geoJsonLoaded: features.length > 0 };
};