'use client';

import { useRef, useState, useEffect } from 'react';
import { initProj4 } from '../utils/map-utils';
import { InfoBarData } from '../types/map-types';
import InfoBar from './sidebar/InfoBar';
import { useKakaoMap } from '../hooks/useKakaoMap';
import { usePolygonData } from '../hooks/usePolygonData';
import { usePopulationLayer } from '../hooks/usePopulationLayer';
import { usePopulationVisual } from '../hooks/usePopulationVisual';
import { IndustryCategory } from '../types/bottom-menu-types';
import { useMapStore } from '../stores/useMapStore';
import { useSidebarStore } from '../stores/useSidebarStore';
import { useBuildingMarkers } from '../hooks/useBuildingMarkers';

initProj4();

interface KakaomapProps {
  polygonClick?: (area: string) => void;
  population: ReturnType<typeof usePopulationVisual>;
  selectedCategory?: IndustryCategory | null;
  onClearCategory?: () => void;
  disableInfoBar?: boolean;
}

export default function Kakaomap({
  polygonClick = (_area: string) => {},
  population,
  selectedCategory = null,
  onClearCategory = () => {},
  disableInfoBar = false,
}: KakaomapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<InfoBarData | null>(null);

  // 1. Load Map
  const { map } = useKakaoMap(mapRef);
  const { setInfoBarOpen } = useSidebarStore();

  // 2. Handle map data & logic
  usePolygonData(map, (data: InfoBarData) => {
    // 선택 모드가 아닐 때만 정보창 표시
    if (!disableInfoBar) {
      setSelectedArea(data);
      setInfoBarOpen(true); // 데이터가 선택되면 사이드바 열기
    }
    if (polygonClick) {
      const label = data.buld_nm || data.adm_nm || 'Unknown';
      polygonClick(label);
    }
  });

  // 3. 건물별 점포 수 마커
  useBuildingMarkers(map, selectedCategory ?? null);

  // 4. Map Store 연동 - 지도 중심 이동 및 마커 표시
  const { center, zoom, markers } = useMapStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map) return;
    if (typeof window === 'undefined' || !window.kakao?.maps) return;

    // 기존 마커 모두 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 마커가 없으면 종료
    if (markers.length === 0) return;

    // 새 마커 생성
    const bounds = new window.kakao.maps.LatLngBounds();

    markers.forEach((markerData) => {
      const position = new window.kakao.maps.LatLng(
        markerData.coords.lat,
        markerData.coords.lng,
      );

      // 마커 생성 (인포윈도우 없이)
      const marker = new window.kakao.maps.Marker({
        position,
        map,
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // 여러 마커일 때 자동 bounds 맞춤
    if (markers.length > 1 || zoom === -1) {
      map.setBounds(bounds);

      // 여유 공간 확보 및 왼쪽 오프셋 적용 (채팅 UI 고려)
      setTimeout(() => {
        // 2단계 줌아웃
        const currentLevel = map.getLevel();
        map.setLevel(currentLevel + 2);
      }, 100);

      // 중심점 오른쪽 이동 → 마커가 화면 왼쪽에 표시됨
      setTimeout(() => {
        const currentCenter = map.getCenter();
        // 경도를 증가 (중심을 동쪽으로) → 마커가 화면 왼쪽에
        const offsetLng = currentCenter.getLng() + 0.01;
        const newCenter = new window.kakao.maps.LatLng(
          currentCenter.getLat(),
          offsetLng,
        );
        map.setCenter(newCenter);
      }, 200);
    } else if (center) {
      // zoom === -2: 중앙 정렬 (오프셋 없음) - 검색 박스용
      if (zoom === -2) {
        const moveLatLng = new window.kakao.maps.LatLng(center.lat, center.lng);
        map.setCenter(moveLatLng);
        map.setLevel(3);
      } else {
        // 단일 마커일 때 중심을 오른쪽으로 오프셋 (채팅용)
        const offsetLng = center.lng;
        const moveLatLng = new window.kakao.maps.LatLng(center.lat, offsetLng);
        map.setCenter(moveLatLng);
        if (zoom > 0) {
          map.setLevel(zoom);
        }
      }
    }

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [center, zoom, markers, map]);


  // 3. 유동인구 격자 레이어 추가
  usePopulationLayer(
    map,
    population.genderFilter,
    population.ageFilter,
    population.showLayer,
    population.getPopulationValue
  );

  return (
    <div className="relative w-full h-full">
      <InfoBar
        data={selectedArea}
        selectedCategory={selectedCategory}
        onClose={() => {
          setSelectedArea(null);
          if (selectedCategory) {
            onClearCategory();
          }
        }}
      />

      <div
        ref={mapRef}
        id="kakao-map"
        className="w-full h-100 bg-gray-100"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}
