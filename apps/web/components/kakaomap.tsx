'use client';

import { useRef, useEffect } from 'react';
import { initProj4 } from '../utils/map-utils';
import { InfoBarData, KakaoMarker, PolygonClickData } from '../types/map-types';
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
  polygonClick?: (data: PolygonClickData) => void;
  population: ReturnType<typeof usePopulationVisual>;
  selectedCategory?: IndustryCategory | null;
  onClearCategory?: () => void;
  disableInfoBar?: boolean;
}

export default function Kakaomap({
  polygonClick,
  population,
  selectedCategory = null,
  onClearCategory,
  disableInfoBar = false,
}: KakaomapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<KakaoMarker[]>([]);

  const { map } = useKakaoMap(mapRef);
  const { selectedArea, selectArea, clearSelection, setInfoBarOpen } =
    useSidebarStore();
  const { center, zoom, markers } = useMapStore();

  usePolygonData(map, (data: InfoBarData) => {
    if (!disableInfoBar) {
      selectArea(data);
    }
    if (polygonClick) {
      const label =
        data.buld_nm || data.adm_nm || data.commercialName || 'Unknown';
      const code = data.adm_cd || data.commercialCode;
      polygonClick({ name: label, code: code });
    }
  });

  useBuildingMarkers(map, selectedCategory ?? null);

  const prevCategoryRef = useRef(selectedCategory);
  useEffect(() => {
    if (selectedCategory && selectedCategory !== prevCategoryRef.current) {
      clearSelection();
      setInfoBarOpen(true);
    }
    prevCategoryRef.current = selectedCategory;
  }, [selectedCategory, clearSelection, setInfoBarOpen]);

  useEffect(() => {
    if (!map) return;
    if (typeof window === 'undefined' || !window.kakao?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (markers.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    markers.forEach((markerData) => {
      const position = new window.kakao.maps.LatLng(
        markerData.coords.lat,
        markerData.coords.lng,
      );

      const marker = new window.kakao.maps.Marker({
        position,
        map,
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (markers.length > 1 || zoom === -1) {
      map.setBounds(bounds);

      setTimeout(() => {
        const currentLevel = map.getLevel();
        map.setLevel(currentLevel + 2);
      }, 100);

      setTimeout(() => {
        const currentCenter = map.getCenter();
        const offsetLng = currentCenter.getLng() + 0.01;
        const newCenter = new window.kakao.maps.LatLng(
          currentCenter.getLat(),
          offsetLng,
        );
        map.setCenter(newCenter);
      }, 200);
    } else if (center) {
      if (zoom === -2) {
        const moveLatLng = new window.kakao.maps.LatLng(center.lat, center.lng);
        map.setCenter(moveLatLng);
        map.setLevel(3);
      } else {
        const offsetLng = center.lng;
        const moveLatLng = new window.kakao.maps.LatLng(center.lat, offsetLng);
        map.setCenter(moveLatLng);
        if (zoom > 0) {
          map.setLevel(zoom);
        }
      }
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [center, zoom, markers, map]);

  usePopulationLayer(
    map,
    population.timeFilter,
    population.genderFilter,
    population.ageFilter,
    population.showLayer,
    population.getPopulationValue,
  );

  const handleClose = () => {
    clearSelection();
    if (selectedCategory && onClearCategory) {
      onClearCategory();
    }
  };

  return (
    <div className="relative w-full h-full">
      <InfoBar
        data={selectedArea}
        selectedCategory={selectedCategory}
        onClose={handleClose}
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
