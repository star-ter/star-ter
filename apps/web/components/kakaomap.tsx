'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { initProj4, convertCoord } from '../utils/map-utils';
import { KakaoMap, KakaoPolygon, GeoJSONFeature } from '../types/map-types';
import polylabel from '@mapbox/polylabel';

initProj4();

declare global {
  interface Window {
    kakao: any;
  }
}

import InfoBar from './sidebar/InfoBar';

export default function Kakaomap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null); // State for sidebar
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const lastLevelGroupRef = useRef<string | null>(null);
  const customOverlaysRef = useRef<any[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const initMap = () => {
    const container = mapRef.current;
    if (!container) return;

    const options = {
      center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // Seoul City Hall
      level: 8,
    };

    const map = new window.kakao.maps.Map(container, options);

    refreshLayer(map);

    // Debounce refresh
    let timeoutId: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshLayer(map);
      }, 500);
    };

    // Events
    window.kakao.maps.event.addListener(map, 'idle', debouncedRefresh);
    window.kakao.maps.event.addListener(map, 'zoom_changed', debouncedRefresh);
  };

  // 지도 줌 레벨에 따라 폴리곤 함수 호출.
  /* @param map Kakao 지도 객체 */
  // 지도 줌 레벨에 따라 폴리곤 함수 호출.
  /* @param map Kakao 지도 객체 */
  const refreshLayer = (map: KakaoMap) => {
    const level = map.getLevel();
    console.log(`Current Zoom Level: ${level}`);

    let currentGroup = '';
    if (level >= 7) currentGroup = 'GU';
    else if (level >= 4) currentGroup = 'DONG';
    else currentGroup = 'BUILDING';

    if (
      currentGroup === lastLevelGroupRef.current &&
      (currentGroup === 'GU' || currentGroup === 'DONG')
    ) {
      console.log(`Skipping fetch for static layer: ${currentGroup}`);
      return;
    }

    lastLevelGroupRef.current = currentGroup;

    if (level >= 7) {
      fetchCombinedBoundary(map, 1);
    } else if (level >= 4) {
      fetchCombinedBoundary(map, 2);
    } else {
      fetchBuildingMock(map);
    }
  };

  // 건물 Mock 데이터를 비동기로 호출하고 지도에 그리는 함수.
  /* @param map Kakao 지도 객체 */
  const fetchBuildingMock = async (map: KakaoMap) => {
    console.log(`Fetching Building Mock Data...`);

    try {
      const res = await fetch(`${API_BASE_URL}/polygon/mock/building`);
      const data = await res.json();

      if (data.features) {
        console.log(`Received ${data.features.length} buildings`);
        drawPolygons(map, data.features, 'vworld_building');
      } else {
        console.warn('Building Mock No Data or Error:', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Building Mock Fetch Error:', err);
    }
  };

  // 구/동 Mock 데이터를 비동기로 호출하고 지도에 그리는 함수.
  /* @param map Kakao 지도 객체
   * @param lowSearch 1: 구(Gu), 2: 동(Dong)
   */
  const fetchCombinedBoundary = async (map: KakaoMap, lowSearch: number) => {
    console.log(`Fetching Combined Boundary...`);
    try {
      const url = `${API_BASE_URL}/polygon/mock?low_search=${lowSearch}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.features) {
        console.log(`Drawing ${data.features.length} features`);
        drawPolygons(map, data.features, 'admin');
      }
    } catch (err) {
      console.error('Combined Boundary Fetch Error:', err);
    }
  };

  // GeoJSON Feature 데이터를 기반으로 폴리곤을 생성하여 지도에 그리는 함수.
  /* @param map Kakao 지도 객체
   * @param features GeoJSON Features 배열
   * @param type 'admin' (행정구역) 또는 'vworld_building' (건물) - 스타일 결정용
   */
  const drawPolygons = (
    map: KakaoMap,
    features: GeoJSONFeature[],
    type: 'admin' | 'vworld_building',
  ) => {
    // Clear existing polygons and overlays
    polygonsRef.current.forEach((poly) => poly.setMap(null));
    polygonsRef.current = [];
    customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    customOverlaysRef.current = [];

    features.forEach((feature: GeoJSONFeature) => {
      const geometry = feature.geometry;
      const props = feature.properties;

      // 이름 정보가 없으면 아예 그리지 않음
      // if (!props.adm_nm && !props.buld_nm) return;

      const paths: any[] = [];
      let centerPoint: any = null;

      if (geometry.type === 'Polygon') {
        const ring = geometry.coordinates[0];
        if (ring) {
          const path = ring.map((c: any) => convertCoord(c[0], c[1]));
          paths.push(path);
        }
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((poly: any) => {
          const path = poly[0].map((c: any) => convertCoord(c[0], c[1]));
          paths.push(path);
          if (!centerPoint && (!props.x || !props.y)) {
            try {
              const [lng, lat] = polylabel(poly, 1.0);
              centerPoint = convertCoord(lng, lat);
            } catch (error) {
              console.warn('Polylabel failed, using simple average:', error);
              let sumLat = 0,
                sumLng = 0;
              path.forEach((p: any) => {
                sumLat += p.getLat();
                sumLng += p.getLng();
              });
              centerPoint = new window.kakao.maps.LatLng(
                sumLat / path.length,
                sumLng / path.length,
              );
            }
          }
        });
      }

      let position;
      if (props.x && props.y) {
        position = convertCoord(Number(props.x), Number(props.y));
      } else if (centerPoint) {
        position = centerPoint;
      }

      paths.forEach((path) => {
        let strokeColor = '#4A90E2';
        let fillColor = '#D1E8FF';
        let fillOpacity = 0.5;
        const strokeOpacity = 0.8;
        const strokeWeight = 2;

        if (type === 'vworld_building') {
          strokeColor = '#FF8C00';
          fillColor = '#FFA500';
          fillOpacity = 0.5;
        }

        const polygon = new window.kakao.maps.Polygon({
          path: path,
          strokeWeight: strokeWeight,
          strokeColor: strokeColor,
          strokeOpacity: strokeOpacity,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
        });
        polygon.setMap(map);
        polygonsRef.current.push(polygon);

        // Click event to open sidebar
        window.kakao.maps.event.addListener(polygon, 'click', () => {
          console.log(`Clicked Area:`, props);
          setSelectedArea(props); // Set state to open sidebar
        });
      });

      // 커스텀 마커 생성
      if (position) {
        const name = props.adm_nm || props.buld_nm || '데이터없음';
        const shortName = name.split(' ').pop(); // '서울특별시 관악구 행운동' -> '행운동'

        const contentEl = document.createElement('div');
        contentEl.innerHTML = `<div style="text-align: center; white-space: nowrap; padding: 4px 8px; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 12px; font-weight: bold; color: #333; cursor: pointer;">${shortName}</div>`;

        contentEl.onclick = () => {
          console.log('Clicked Overlay:', props);
          setSelectedArea(props);
        };

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: contentEl,
          yAnchor: 1,
        });

        customOverlay.setMap(map);
        customOverlaysRef.current.push(customOverlay);
      }
    });
  };

  useEffect(() => {
    if (loaded && window.kakao && window.kakao.maps && mapRef.current) {
      window.kakao.maps.load(() => {
        initMap();
      });
    }
  }, [loaded]);

  return (
    <div className="relative w-full h-full">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />

      <InfoBar data={selectedArea} onClose={() => setSelectedArea(null)} />

      <div
        ref={mapRef}
        className="w-full h-100 bg-gray-100" // Removed borders for full screen feel
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}
