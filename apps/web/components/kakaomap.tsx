'use client';

import { useRef, useState, useEffect } from 'react';
import { initProj4 } from '../utils/map-utils';
import { InfoBarData } from '../types/map-types';
import InfoBar from './sidebar/InfoBar';
import { useKakaoMap } from '../hooks/useKakaoMap';
import { usePolygonData } from '../hooks/usePolygonData';
import { IndustryCategory } from '../types/bottom-menu-types';
import { useMapStore } from '../stores/useMapStore';

initProj4();

interface KakaomapProps {
  polygonClick?: (area: string) => void;
  selectedCategory?: IndustryCategory | null;
  onClearCategory?: () => void;
}

export default function Kakaomap({
  polygonClick = (_area: string) => {},
  selectedCategory = null,
  onClearCategory = () => {},
}: KakaomapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<InfoBarData | null>(null);

  // 1. Load Map
  const { map } = useKakaoMap(mapRef);

  // 2. Handle map data & logic
  usePolygonData(map, (data: InfoBarData) => {
    setSelectedArea(data);
    if (polygonClick) {
      const label = data.buld_nm || data.adm_nm || 'Unknown';
      polygonClick(label);
    }
  });

  // 3. Map Store 연동 - 지도 중심 이동 및 마커 표시
  const { center, zoom, markers } = useMapStore();
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
        markerData.coords.lng
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
      // 여유 공간 확보 및 왼쪽 오프셋 적용
      setTimeout(() => {
        const currentLevel = map.getLevel();
        map.setLevel(currentLevel + 1); // 줌아웃
        
        // 중심점을 왼쪽으로 이동 (오른쪽 채팅 UI 때문에)
        const currentCenter = map.getCenter();
        const offsetLng = currentCenter.getLng() - 0.02; // 왼쪽으로 약간 이동
        const newCenter = new window.kakao.maps.LatLng(currentCenter.getLat(), offsetLng);
        map.setCenter(newCenter);
      }, 100);
    } else if (center) {
      // 단일 마커일 때 중심을 왼쪽으로 오프셋
      const offsetLng = center.lng - 0.01; // 왼쪽으로 약간 이동
      const moveLatLng = new window.kakao.maps.LatLng(center.lat, offsetLng);
      map.setCenter(moveLatLng);
      if (zoom > 0) {
        map.setLevel(zoom);
      }
    }

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [center, zoom, markers, map]);

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
        className="w-full h-100 bg-gray-100"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}
