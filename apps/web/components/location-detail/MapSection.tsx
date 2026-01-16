'use client';

import { useRef, useEffect } from 'react';
import {
  useKakaoMap,
  type KakaoPolygon,
  type KakaoCustomOverlay,
  type KakaoCircle,
} from '../../hooks/useKakaoMap';
import { PolygonData, RealEstateItem } from './types';
import { PriceFilterBar } from './PriceFilterBar';

import { TrafficFilterBar } from './TrafficFilterBar';
import { useStoreLocations } from './hooks';

import { usePopulationLayer } from './hooks/usePopulationLayer';
import { GenderFilter, AgeFilter } from './types';

/**
 * 【MapSection 컴포넌트】
 * @param mode - 현재 활성화된 탭 ('realestate'일 때 마커 표시, 'analysis'일 때 업종 분석)
 * @param polygonData - GeoJSON MultiPolygon 형태의 폴리곤 데이터
 * @param centerX - 중심점 경도 (longitude)
 * @param centerY - 중심점 위도 (latitude)
 * @param realEstateItems - 부동산 매물 리스트 (마커 표시용)
 */

/**
 * 【MapSectionProps 인터페이스】
 *
 * 컴포넌트가 받을 수 있는 props(속성)들을 타입으로 정의합니다.
 * TypeScript의 인터페이스를 사용하면 잘못된 props 전달을 컴파일 타임에 감지할 수 있습니다.
 */
interface MapSectionProps {
  mode?: 'matching' | 'traffic' | 'analysis' | 'realestate' | 'news';
  polygonData: PolygonData | null;
  centerX?: number;
  centerY?: number;
  realEstateItems?: RealEstateItem[];
  selectedItemId?: string | null;
  onMarkerClick?: (item: RealEstateItem) => void;
  // 【가격 필터 Props】
  priceFilter?: {
    minDeposit: number;
    maxDeposit: number;
    minRent: number;
    maxRent: number;
    depositRange: [number, number];
    rentRange: [number, number];
  };
  onDepositChange?: (range: [number, number]) => void;
  onRentChange?: (range: [number, number]) => void;
  onBoundsChange?: (bounds: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  }) => void;
  filteredCount?: number;
  totalCount?: number;
  // 【업종 분석 카테고리 선택 Props】
  selectedAnalysisCategory?: string;
  regionCode?: string;
  // 【유동인구 히트맵 Props (traffic 모드)】
  trafficFilter?: {
    isPlaying: boolean;
    currentTimeIndex: number;
    genderFilter: GenderFilter;
    ageFilter: AgeFilter;
  };
  onTrafficPlayToggle?: () => void;
  onTrafficTimeChange?: (index: number) => void;
  onTrafficFilterChange?: (gender: GenderFilter, age: AgeFilter) => void;
}

export function MapSection({
  mode = 'matching',
  polygonData,
  centerX,
  centerY,
  realEstateItems = [],
  selectedItemId,
  onMarkerClick,
  priceFilter,
  onDepositChange,
  onRentChange,
  onBoundsChange,
  filteredCount = 0,
  totalCount = 0,
  selectedAnalysisCategory,
  regionCode,
  trafficFilter,
  onTrafficPlayToggle,
  onTrafficTimeChange,
  onTrafficFilterChange,
}: MapSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<KakaoPolygon[] | null>([]);
  const markersRef = useRef<KakaoCustomOverlay[]>([]);
  const industryMarkersRef = useRef<KakaoCustomOverlay[]>([]); // 업종 분석 마커용
  const isDraggingRef = useRef(false); // 드래그 상태 추적



  // 【커스텀 훅 사용】 점포 위치 데이터 fetch
  const { stores } = useStoreLocations(
    regionCode,
    selectedAnalysisCategory,
    mode === 'analysis', // analysis 모드일 때만 활성화
  );



  const { map, loaded } = useKakaoMap(mapRef);

  // 【유동인구 히트맵 훅】 traffic 모드일 때만 활성화
  const currentHour = trafficFilter?.currentTimeIndex ?? 12;

  usePopulationLayer({
    map: map,
    hour: currentHour,
    genderFilter: trafficFilter?.genderFilter || 'all',
    ageFilter: trafficFilter?.ageFilter || 'all',
    isVisible: mode === 'traffic' && loaded,
    containerId: 'traffic-map-container',
  });

  // 폴리곤 렌더링 + 드래그/idle 이벤트 등록
  useEffect(() => {
    if (!map || !loaded) return;

    // 드래그 이벤트 리스너 등록 (마커 클릭 방지용)
    window.kakao.maps.event.addListener(map, 'dragstart', () => {
      isDraggingRef.current = true;
    });
    window.kakao.maps.event.addListener(map, 'dragend', () => {
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    });

    // 지도 이동/줌 완료 시 bounds 콜백 호출
    window.kakao.maps.event.addListener(map, 'idle', () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        onBoundsChange({
          sw: { lat: sw.getLat(), lng: sw.getLng() },
          ne: { lat: ne.getLat(), lng: ne.getLng() },
        });
      }
    });

    if (!polygonData) return;

    if (polygonRef.current) {
      polygonRef.current.forEach((polygon) => polygon.setMap(null));
      polygonRef.current = [];
    }

    for (const polygon of polygonData.coordinates) {
      const exteriorRing = polygon[0];

      const centerLat = centerY ?? exteriorRing[0][1];
      const centerLng = centerX ?? exteriorRing[0][0];
      const centerLatLng = new window.kakao.maps.LatLng(centerLat, centerLng);

      map.setCenter(centerLatLng);
      map.setLevel(3);

      const kakaoPath = exteriorRing.map(
        (coord) => new window.kakao.maps.LatLng(coord[1], coord[0]),
      );

      const kakaoPolygon = new window.kakao.maps.Polygon({
        path: kakaoPath,
        strokeWeight: 3,
        strokeColor: '#3B82F6',
        strokeOpacity: 1,
        strokeStyle: 'solid',
        fillColor: '#ffffff',
        fillOpacity: 0.3,
      });
      kakaoPolygon.setMap(map);
      polygonRef.current?.push(kakaoPolygon);
    }

    return () => {
      if (polygonRef.current) {
        polygonRef.current.forEach((polygon) => polygon.setMap(null));
        polygonRef.current = [];
      }
    };
  }, [map, loaded, polygonData, centerX, centerY, onBoundsChange]);

  /**
   * 【경쟁 구역 오버레이】
   *
   * 점 마커 대신 밀집도 기반 원형 오버레이로 경쟁 강도 시각화
   * - 가까운 곳에 점포 많음 → 🔴 빨간색 (위험)
   * - 적당함 → 🟡 노란색
   * - 적음 → 🟢 초록색
   */
  useEffect(() => {
    if (!map || !loaded) return;

    // 기존 오버레이 제거
    industryMarkersRef.current.forEach((marker) => marker.setMap(null));
    industryMarkersRef.current = [];

    // analysis 모드가 아니면 종료
    if (mode !== 'analysis' || stores.length === 0) return;

    // 밀집도 계산 함수
    const getDistanceMeters = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number,
    ): number => {
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // 각 점포의 주변 밀집도 계산
    const GRID_SIZE = 50; // 50m 반경
    const storesWithDensity = stores.map((store) => {
      const nearbyCount = stores.filter(
        (other) =>
          other !== store &&
          getDistanceMeters(store.lat, store.lng, other.lat, other.lng) <=
            GRID_SIZE * 2,
      ).length;
      return { store, nearbyCount };
    });

    const maxNearby = Math.max(
      ...storesWithDensity.map((s) => s.nearbyCount),
      1,
    );

    // 클러스터링: 이미 처리된 근처 점포는 스킵
    const processed = new Set<number>();
    const circles: (KakaoCircle | KakaoCustomOverlay)[] = [];
    const warningPositions: { lat: number; lng: number }[] = []; // 경고 마커 위치 추적

    storesWithDensity
      .sort((a, b) => b.nearbyCount - a.nearbyCount)
      .forEach((item, index) => {
        if (processed.has(index)) return;

        // 이미 그려진 원과 가까우면 스킵
        const isNearExisting = circles.some((circle) => {
          const pos = circle.getPosition();
          const dist = getDistanceMeters(
            item.store.lat,
            item.store.lng,
            pos.getLat(),
            pos.getLng(),
          );
          return dist < GRID_SIZE;
        });

        if (isNearExisting) {
          processed.add(index);
          return;
        }

        // 밀집도 (0~1)
        const density = Math.min(item.nearbyCount / maxNearby, 1);

        // 색상: 초록 → 노랑 → 빨강
        let fillColor: string;
        const isHotspot = density >= 0.6;

        if (density < 0.3) {
          fillColor = '#10B981'; // emerald
        } else if (density < 0.6) {
          fillColor = '#F59E0B'; // amber
        } else {
          fillColor = '#E11D48'; // Rose-600, more professional vibrant red
        }

        const baseRadius = 15 + 25 * density;

        // 🔥 헬퍼 함수: 펄스 콘텐츠 생성 (고유 클래스명으로 스타일 충돌 방지)
        const createPulseContent = (
          color: string,
          radius: number,
          uniqueId: number,
        ) => `
          <div style="position: relative; width: 0; height: 0;">
            <style>
              @keyframes mapPulse-${uniqueId} {
                0% { transform: translate(-50%, -50%) scale(1.0); opacity: 0.6; }
                100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
              }
              .density-pulse-${uniqueId} {
                position: absolute;
                width: ${radius * 2}px;
                height: ${radius * 2}px;
                background: radial-gradient(circle, ${color}77 0%, ${color}33 50%, ${color}00 100%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
              }
              .density-pulse-${uniqueId}::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 100%;
                height: 100%;
                border: 2px solid ${color}88;
                border-radius: 50%;
                animation: mapPulse-${uniqueId} 2.2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
              }
            </style>
            <div class="density-pulse-${uniqueId}"></div>
          </div>
        `;

        // 🔥 모든 밀도에 동일한 펄스 효과 적용
        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(
            item.store.lat,
            item.store.lng,
          ),
          content: createPulseContent(fillColor, baseRadius, index),
          zIndex: 1,
        });
        overlay.setMap(map);
        circles.push(overlay);

        // 🔥 경쟁 과열 지역에 경고 마커 추가
        // 이미 표시된 경고 마커와 100m 이내면 중복 표시 안 함
        if (isHotspot) {
          const isNearExistingWarning = warningPositions.some(
            (pos) =>
              getDistanceMeters(
                item.store.lat,
                item.store.lng,
                pos.lat,
                pos.lng,
              ) < 100,
          );

          if (!isNearExistingWarning) {
            const warningContent = `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateY(-16px);
              ">
                <div style="
                  background: rgba(255, 255, 255, 0.98);
                  backdrop-filter: blur(8px);
                  color: #9F1239;
                  padding: 7px 14px;
                  border-radius: 100px;
                  font-size: 13px;
                  font-weight: 800;
                  box-shadow: 0 4px 20px rgba(159, 18, 57, 0.12), 0 0 0 1px rgba(159, 18, 57, 0.1);
                  white-space: nowrap;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <span style="
                    width: 7px;
                    height: 7px;
                    background: #E11D48;
                    border-radius: 50%;
                    display: inline-block;
                    box-shadow: 0 0 6px #E11D48;
                  "></span>
                  경쟁 과열
                </div>
                <div style="
                  width: 0;
                  height: 0;
                  border-left: 7px solid transparent;
                  border-right: 7px solid transparent;
                  border-top: 7px solid rgba(255, 255, 255, 0.98);
                  margin-top: -1px;
                "></div>
              </div>
            `;

            const warningOverlay = new window.kakao.maps.CustomOverlay({
              position: new window.kakao.maps.LatLng(
                item.store.lat,
                item.store.lng,
              ),
              content: warningContent,
              yAnchor: 1,
              xAnchor: 0.5,
              zIndex: 10,
            });

            warningOverlay.setMap(map);
            circles.push(warningOverlay as unknown as KakaoCircle);
            warningPositions.push({ lat: item.store.lat, lng: item.store.lng });
          }
        }

        processed.add(index);
      });

    // ref에 저장 (cleanup용으로 any 캐스팅)
    industryMarkersRef.current = circles as unknown as KakaoCustomOverlay[];

    return () => {
      circles.forEach((circle) => circle.setMap(null));
    };
  }, [map, loaded, mode, stores]);

  /**
   * 【중요 개념: 카카오맵 CustomOverlay와 클릭 이벤트】
   * - CustomOverlay는 HTML 문자열을 content로 받습니다
   * - React의 onClick이 아닌 순수 HTML의 onclick 속성 사용
   * - 클릭 핸들러는 window 전역 객체에 함수로 등록해야 함
   */
  useEffect(() => {
    if (!map || !loaded) return;

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 'realestate' 모드가 아니면 종료
    if (mode !== 'realestate' || realEstateItems.length === 0) return;

    // 전역 함수 저장용 배열 (cleanup 시 제거하기 위함)
    const globalFunctionNames: string[] = [];

    // 새로운 마커 생성
    realEstateItems.forEach((item) => {
      if (!item.centerlatitude || !item.centerlongitude) return;

      const position = new window.kakao.maps.LatLng(
        item.centerlatitude,
        item.centerlongitude,
      );

      // 가격 포맷팅 (만원 단위)
      const depositMan = item.deposit ? Math.round(item.deposit / 10) : 0;
      const rentMan = item.monthlyrent ? Math.round(item.monthlyrent / 10) : 0;

      // 【선택 상태에 따른 스타일 분기】
      // 선택된 마커: 파란 배경 + 흰 글씨 (반전)
      // 기본 마커: 흰 배경 + 파란 글씨
      const isSelected = selectedItemId === item.id;
      const bgColor = isSelected ? '#2563EB' : '#FFFFFF';
      const textColor = isSelected ? '#FFFFFF' : '#2563EB';
      const borderWidth = isSelected ? '2px' : '1px';
      const scale = isSelected ? 'scale(1.1)' : 'scale(1)';

      // 【전역 함수 등록】
      // CustomOverlay의 onclick에서 호출할 수 있도록 window에 함수 등록
      const funcName = `__markerClick_${item.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      globalFunctionNames.push(funcName);
      (window as unknown as Record<string, () => void>)[funcName] = () => {
        if (isDraggingRef.current) return; // 드래그 중이면 클릭 무시
        onMarkerClick?.(item);
      };

      const content = `
        <div 
          onclick="window.${funcName}()" 
          style="
            padding: 4px 8px; 
            background: ${bgColor}; 
            color: ${textColor}; 
            font-size: 15px; 
            font-weight: bold; 
            border: ${borderWidth} solid #2563EB; 
            border-radius: 6px; 
            white-space: nowrap; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            transition: transform 0.2s;
            transform: ${scale};
          "
        >
          ${depositMan} / ${rentMan}
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1.2,
        zIndex: isSelected ? 100 : 1, // 선택된 마커가 위에 표시되도록
      });

      overlay.setMap(map);
      markersRef.current.push(overlay);
    });

    // 【Cleanup 함수】
    // 컴포넌트 언마운트 또는 의존성 변경 시 전역 함수 정리
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, loaded, mode, realEstateItems, selectedItemId, onMarkerClick]);

  return (
    <div className="w-full h-full relative">
      {/* 지도 로딩 전 플레이스홀더 */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-[32px]">
          <div className="text-slate-400 text-sm">지도 로딩 중...</div>
        </div>
      )}

      {/* 카카오맵 컨테이너 */}
      <div
        id="traffic-map-container"
        ref={mapRef}
        className="w-full h-full rounded-[32px] shadow-md overflow-hidden"
      />

      {/* 가격 필터 슬라이더 (realestate 모드일 때만 표시) */}
      {mode === 'realestate' &&
        priceFilter &&
        onDepositChange &&
        onRentChange && (
          <PriceFilterBar
            minDeposit={priceFilter.minDeposit}
            maxDeposit={priceFilter.maxDeposit}
            minRent={priceFilter.minRent}
            maxRent={priceFilter.maxRent}
            depositRange={priceFilter.depositRange}
            rentRange={priceFilter.rentRange}
            onDepositChange={onDepositChange}
            onRentChange={onRentChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />
        )}
      {/* 유동인구 필터 바 (traffic 모드일 때만 표시) */}
      {mode === 'traffic' && trafficFilter && (
        <TrafficFilterBar
          isPlaying={trafficFilter.isPlaying}
          onTogglePlay={onTrafficPlayToggle || (() => {})}
          currentHour={trafficFilter.currentTimeIndex}
          onHourChange={onTrafficTimeChange || (() => {})}
          genderFilter={trafficFilter.genderFilter}
          ageFilter={trafficFilter.ageFilter}
          onFilterChange={onTrafficFilterChange || (() => {})}
        />
      )}
    </div>
  );
}
