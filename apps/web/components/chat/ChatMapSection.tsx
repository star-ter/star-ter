'use client';

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react';
import {
  useKakaoMap,
  type KakaoCustomOverlay,
  type KakaoPolygon,
} from '../../hooks/useKakaoMap';
import { type MapCommand } from './actions/commandTypes';
import { usePopulationLayer } from '../location-detail/hooks/usePopulationLayer';
import { type MarkerData } from './types/markerTypes';
import { type BuildingInfo, type AreaInfo } from './types/mapTypes';
import { MapInfoPanel } from './MapInfoPanel';
import { useBuildingPolygons } from './hooks/useBuildingPolygons';
import { PolygonData, Coordinate } from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/**
 * ChatMapSection 컴포넌트
 *
 * - 지도 라이프사이클 관리 (로드, 리사이즈)
 * - 부모 컴포넌트(ChatPage)로부터 액션을 받아 지도 제어 수행
 */

export interface ChatMapSectionRef {
  executeCommand: (command: MapCommand) => void;
}

interface ChatMapSectionProps {
  isOpen: boolean;
}

// ----------------------------------------------------------------------
// [설정] 최소/최대 너비 상수
const MIN_WIDTH = 400;
const MAX_WIDTH = 800;
// ----------------------------------------------------------------------

export const ChatMapSection = forwardRef<
  ChatMapSectionRef,
  ChatMapSectionProps
>(({ isOpen }, ref) => {
  // 지도 DOM 참조
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<KakaoCustomOverlay[]>([]);
  const commercialPolygonRef = useRef<KakaoPolygon | null>(null);

  // 카카오맵 훅 사용
  const { map, loaded, error } = useKakaoMap(mapRef, {
    center: { lat: 37.566826, lng: 126.9786567 }, // 서울시청 기본 중심
    level: 4,
  });

  // 상태 관리
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  // 건물/상권 선택 상태 (MapInfoPanel용)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(
    null,
  );
  const [selectedArea, setSelectedArea] = useState<AreaInfo | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(false);

  // 건물 클릭 시 점포 정보 가져오기
  const handleBuildingClick = useCallback(
    async (building: { id: string; name: string; polygonWkt: string }) => {
      setIsInfoLoading(true);
      setSelectedArea(null); // 상권 선택 해제

      try {
        // WKT 폴리곤으로 점포 조회
        const params = new URLSearchParams({
          latitude: '0', // 폴리곤 사용 시 필요 없지만 API가 요구함
          longitude: '0',
          polygon: building.polygonWkt,
        });

        const response = await fetch(`${API_BASE_URL}/market/stores?${params}`);
        if (!response.ok) throw new Error('Failed to fetch stores');

        const data = await response.json();

        setSelectedBuilding({
          id: building.id,
          name: building.name,
          polygonWkt: building.polygonWkt,
          stores: data.stores || [],
        });
      } catch (error) {
        console.error(
          '[ChatMapSection] Failed to fetch building stores:',
          error,
        );
        setSelectedBuilding({
          id: building.id,
          name: building.name,
          stores: [],
        });
      } finally {
        setIsInfoLoading(false);
      }
    },
    [],
  );

  // 건물 폴리곤 훅 사용 (줄 레벨 3 이하에서 표시)
  useBuildingPolygons({
    map,
    loaded,
    zoomThreshold: 3,
    onBuildingClick: handleBuildingClick,
  });

  // 유동인구 히트맵 훅 사용
  usePopulationLayer({
    map,
    hour: 12, // 기본값 12시
    genderFilter: 'all',
    ageFilter: 'all',
    isVisible: isHeatmapVisible && loaded,
    containerId: 'chat-map-container',
  });

  // 마커 렌더링 효과
  useEffect(() => {
    if (!map || !loaded) return;

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (markers.length === 0) return;

    // 전역 함수 저장용 (클릭 이벤트)
    const globalFunctionNames: string[] = [];

    markers.forEach((item) => {
      const position = new window.kakao.maps.LatLng(item.lat, item.lng);

      // 클릭 핸들러 등록
      const funcName = `__chatMarkerClick_${item.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      globalFunctionNames.push(funcName);
      (window as unknown as Record<string, () => void>)[funcName] = () => {
        console.log('Marker clicked:', item.id);
        item.onClick?.();
      };

      // 마커 스타일 결정
      const isCompetitor = item.type === 'competitor';
      const bgColor = isCompetitor ? '#EF4444' : '#2563EB';
      const markerLabel = item.label || (isCompetitor ? '경쟁점' : '마커');

      const content = `
          <div 
            onclick="window.${funcName}()" 
            style="
              padding: 4px 8px; 
              background: ${bgColor}; 
              color: #FFFFFF; 
              font-size: 14px; 
              font-weight: bold; 
              border: 1px solid #FFFFFF; 
              border-radius: 6px; 
              white-space: nowrap; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              cursor: pointer;
            "
          >
            ${markerLabel}
          </div>
        `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1.2,
        zIndex: 10,
      });

      overlay.setMap(map);
      markersRef.current.push(overlay);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      // 전역 함수 정리는 여기서 생략하거나 필요시 추가
    };
  }, [map, loaded, markers]);

  const clearCommercialPolygon = useCallback(() => {
    if (!commercialPolygonRef.current) return;

    if (Array.isArray(commercialPolygonRef.current)) {
      commercialPolygonRef.current.forEach((polygon: KakaoPolygon) =>
        polygon.setMap(null),
      );
    } else {
      commercialPolygonRef.current.setMap(null);
    }

    commercialPolygonRef.current = null;
  }, []);

  const drawCommercialPolygon = useCallback(
    (polygon: PolygonData) => {
      if (!map || !loaded) return;

      clearCommercialPolygon();

      const polygonStyle = {
        strokeWeight: 3,
        strokeColor: '#3B82F6',
        strokeOpacity: 1,
        strokeStyle: 'solid',
        fillColor: '#ffffff',
        fillOpacity: 0.3,
      };

      const polygons: KakaoPolygon[] = [];
      const coords = polygon.coordinates;

      if (polygon.type === 'MultiPolygon') {
        (coords as Coordinate[][][]).forEach((polygonCoords) => {
          const outerRing = polygonCoords[0];
          const path = outerRing.map(
            (coord: Coordinate) =>
              new window.kakao.maps.LatLng(coord[1], coord[0]),
          );

          const polygonItem = new window.kakao.maps.Polygon({
            path,
            ...polygonStyle,
          });
          polygonItem.setMap(map);
          polygons.push(polygonItem);
        });
      } else {
        const pathCoords = (coords as Coordinate[][])[0];
        const path = pathCoords.map(
          (coord: Coordinate) =>
            new window.kakao.maps.LatLng(coord[1], coord[0]),
        );

        const polygonItem = new window.kakao.maps.Polygon({
          path,
          ...polygonStyle,
        });
        polygonItem.setMap(map);
        polygons.push(polygonItem);
      }

      commercialPolygonRef.current = polygons as unknown as KakaoPolygon;
    },
    [map, loaded, clearCommercialPolygon],
  );

  // 부모 컴포넌트에 메서드 노출
  useImperativeHandle(ref, () => ({
    executeCommand: (command: MapCommand) => {
      if (!map || !loaded) {
        console.warn('Map is not ready yet.');
        return;
      }

      console.log('[ChatMapSection] Executing command:', command);

      try {
        if (command.type === 'map.pan_to') {
          const moveLatLon = new window.kakao.maps.LatLng(
            command.payload.lat,
            command.payload.lng,
          );
          map.panTo(moveLatLon);

          if (command.payload.zoom) {
            map.setLevel(command.payload.zoom);
          }
          return;
        }

        if (command.type === 'map.setLayer') {
          if (command.payload.layer === 'footTraffic') {
            const visible = command.payload.visible !== false;
            setIsHeatmapVisible(visible);
            console.log(`Heatmap visibility set to ${visible}`);
          }
          return;
        }

        if (command.type === 'map.setMarkers') {
          setMarkers(command.payload.markers);
          return;
        }

        if (command.type === 'map.showCommercialArea') {
          drawCommercialPolygon(command.payload.polygon);
          setSelectedBuilding(null);
          setSelectedArea(command.payload.area);
          setIsInfoLoading(false);
        }
      } catch (e) {
        console.error('Failed to execute map command:', e);
      }
    },
  }));

  // [Map Resize Handler]
  // 지도를 담고 있는 div의 크기가 변할 때(예: 사이드바 열림/닫힘)
  // map.relayout()을 호출하여 지도가 깨지지 않도록 함
  useEffect(() => {
    if (!map || !mapRef.current) return;

    const observer = new ResizeObserver(() => {
      map.relayout();
      try {
        // 리사이즈 시 중심점 유지
        const center = map.getCenter();
        map.setCenter(center);
      } catch {
        // ignore
      }
    });

    observer.observe(mapRef.current);

    return () => observer.disconnect();
  }, [map]);

  // ========================================================================
  // [Resize Logic] 너비 조절 로직
  // ========================================================================
  const [width, setWidth] = useState(MIN_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // 리사이즈 시작 시점의 값들을 저장하기 위한 ref
  const resizeStartRef = useRef({ x: 0, width: 0 });

  // 드래그 시작
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    // 시작 시점의 마우스 위치와 현재 너비 저장
    resizeStartRef.current = {
      x: e.clientX,
      width: width,
    };
  };

  // 드래그 중 및 종료 (Window 이벤트)
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // 이동한 거리(delta) 계산
      const deltaX = e.clientX - resizeStartRef.current.x;

      // 기존 너비 + 이동 거리 적용
      let newWidth = resizeStartRef.current.width + deltaX;

      // 최소/최대 너비 제한 적용
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (MAX_WIDTH > 0 && newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      className={`relative bg-background rounded-2xl border border-border
                    transition-all duration-300 flex flex-col`}
      style={{
        // isOpen일 때는 width state 사용, 아니면 0
        width: isOpen ? width : 0,
        marginRight: isOpen ? '1rem' : 0,
        height: '100%',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        // 리사이즈 중에는 transition 없애서 버벅임 방지
        transition: isResizing
          ? 'none'
          : 'width 300ms ease, margin-right 300ms ease, opacity 300ms ease',
      }}
    >
      {/* 리사이즈 핸들 (오른쪽 가장자리) */}
      <div
        onMouseDown={startResizing}
        className={`absolute top-0 right-0 w-4 h-full cursor-col-resize z-50 flex items-center justify-center
                      hover:bg-primary/10 transition-colors group`}
        // 드래그 영역을 좀 더 넓게 잡기 위해 -right-2 등으로 조정 가능하나,
        // 여기서는 심플하게 오른쪽 끝 내부 4px + 외부 확장은 CSS로 처리하거나 현재 유지
        style={{ right: 0 }}
      >
        {/* 핸들 시각적 표시 (작은 바) */}
        <div className="w-1 h-8 bg-border rounded-full group-hover:bg-primary opacity-0 group-hover:opacity-100 transition-all" />
      </div>

      {/* 지도 영역 (60%) - 패딩 적용 */}
      <div className="h-[60%] w-full p-4 pb-0">
        <div
          id="chat-map-container"
          ref={mapRef}
          className="h-full w-full rounded-2xl overflow-hidden border border-border relative bg-muted"
        >
          {!loaded && !error && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto mb-2" />
                <p className="text-caption">지도 로딩 중...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="h-full flex items-center justify-center bg-destructive/10">
              <div className="text-center text-destructive">
                <p className="text-body">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 부가 정보 영역 (나머지 40%) */}
      <div className="flex-1 w-full p-4 overflow-y-auto">
        <MapInfoPanel
          selectedBuilding={selectedBuilding}
          selectedArea={selectedArea}
          isLoading={isInfoLoading}
        />
      </div>
    </div>
  );
});

ChatMapSection.displayName = 'ChatMapSection';
