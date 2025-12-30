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
import { PopulationBar } from './population/PopulationBar';

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
  const { center, zoom, markers, setZoom, setCenter, clearMarkers } =
    useMapStore();

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

    const bounds = new window.kakao.maps.LatLngBounds();

    markers.forEach((markerData) => {
      const position = new window.kakao.maps.LatLng(
        markerData.coords.lat,
        markerData.coords.lng,
      );

      let marker: KakaoMarker;

      if (markerData.style === 'pulse') {
        /* Custom Overlay Marker (Pulse) - AI Search Result */
        const content = document.createElement('div');
        content.className = 'custom-map-marker';
        content.innerHTML = `
          <div class="marker-pin"></div>
          <div class="marker-pulse"></div>
        `;

        marker = new window.kakao.maps.CustomOverlay({
          position,
          content: content,
          map,
          yAnchor: 0.5,
          zIndex: 3,
        }) as unknown as KakaoMarker;
      } else {
        /* Standard Marker - Regular */
        marker = new window.kakao.maps.Marker({
          position,
          map,
        });
      }

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
      const currentMapCenter = map.getCenter();
      const latDiff = Math.abs(currentMapCenter.getLat() - center.lat);
      const lngDiff = Math.abs(currentMapCenter.getLng() - center.lng);
      const isFar = latDiff > 0.00001 || lngDiff > 0.00001;

      if (isFar) {
        const moveLatLng = new window.kakao.maps.LatLng(center.lat, center.lng);
        map.panTo(moveLatLng, { animate: { duration: 1500 } });

        if (zoom === -2) {
          setTimeout(
            () => map.setLevel(3, { animate: { duration: 800 } }),
            1600,
          );
        } else if (zoom > 0) {
          setTimeout(
            () => map.setLevel(zoom, { animate: { duration: 800 } }),
            1600,
          );
        }
      } else {
        if (zoom === -2 && map.getLevel() !== 3) {
          map.setLevel(3, { animate: { duration: 800 } });
        } else if (zoom > 0 && map.getLevel() !== zoom) {
          map.setLevel(zoom, { animate: { duration: 800 } });
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

  useEffect(() => {
    if (!map) return;

    setZoom(map.getLevel());
    const initialCenter = map.getCenter();
    setCenter({ lat: initialCenter.getLat(), lng: initialCenter.getLng() });

    const handleZoomChange = () => {
      if (useMapStore.getState().isMoving) return;
      const level = map.getLevel();
      setZoom(level);
    };

    const handleCenterChange = () => {
      if (useMapStore.getState().isMoving) return;
      const center = map.getCenter();
      setCenter({ lat: center.getLat(), lng: center.getLng() });
    };

    const handleDragStart = () => {
      clearMarkers();
    };

    window.kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChange);
    window.kakao.maps.event.addListener(
      map,
      'center_changed',
      handleCenterChange,
    );
    window.kakao.maps.event.addListener(map, 'dragend', handleCenterChange);
    window.kakao.maps.event.addListener(map, 'dragstart', handleDragStart);

    return () => {
      window.kakao.maps.event.removeListener(
        map,
        'zoom_changed',
        handleZoomChange,
      );
      window.kakao.maps.event.removeListener(
        map,
        'center_changed',
        handleCenterChange,
      );
      window.kakao.maps.event.removeListener(
        map,
        'dragend',
        handleCenterChange,
      );
      window.kakao.maps.event.removeListener(map, 'dragstart', handleDragStart);
    };
  }, [map, setZoom, setCenter, clearMarkers]);

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

      {/* 유동인구 인포바 (나만 볼 수 있게 지도 위에 플로팅) */}
      {population.showLayer && (
        <div className="absolute right-6 bottom-32 z-50">
          <PopulationBar />
        </div>
      )}
    </div>
  );
}
