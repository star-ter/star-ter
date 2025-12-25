'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { initProj4, convertCoord } from '../utils/map-utils';
import { KakaoMap, KakaoPolygon, CustomArea } from '../types/map-types';
import polylabel from '@mapbox/polylabel';

initProj4();

declare global {
  interface Window {
    kakao: any;
  }
}

import InfoBar from './sidebar/InfoBar';

export default function Kakaomap({ polygonClick = (area: string) => {} }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null); // State for sidebar
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const lastLevelGroupRef = useRef<string | null>(null);
  const customOverlaysRef = useRef<any[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const clickRef = useRef(polygonClick);

  useEffect(() => {
    clickRef.current = polygonClick;
  }, [polygonClick]);

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

      const features = data;

      if (Array.isArray(features)) {
        console.log(`Received ${features.length} buildings`);
        drawPolygons(map, features, 'vworld_building');
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

      if (Array.isArray(data)) {
        console.log(`Drawing ${data.length} features`);
        drawPolygons(map, data, 'admin');
      }
    } catch (err) {
      console.error('Combined Boundary Fetch Error:', err);
    }
  };

  // 통합된 폴리곤 그리기 함수 (GeoJSON/CustomArea  모두 처리)
  /* @param map Kakao 지도 객체
   * @param features 데이터 배열 (모두 CustomArea 구조로 가정, GeoJSON 호환성 유지)
   * @param type 'admin' (행정구역) 또는 'vworld_building' (건물) - 스타일 결정용
   */
  const drawPolygons = (
    map: KakaoMap,
    features: CustomArea[],
    type: 'admin' | 'vworld_building',
  ) => {
    // Clear existing polygons and overlays
    polygonsRef.current.forEach((poly) => poly.setMap(null));
    polygonsRef.current = [];
    customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    customOverlaysRef.current = [];

    features.forEach((feature: CustomArea) => {
      // polygons 제외한 나머지 속성만 props로 추출
      const { polygons, ...props } = feature;
      const paths: any[] = [];
      let centerPoint: any = null;

      if (polygons && Array.isArray(polygons)) {
        let rings: any[] = [];
        const isMultiPolygon = Array.isArray(polygons[0]?.[0]?.[0]);

        if (isMultiPolygon) {
          // 4 Levels
          polygons.forEach((poly: any) => {
            if (Array.isArray(poly)) {
              poly.forEach((ring: any) => rings.push(ring));
            }
          });
        } else {
          // 3 Levels
          rings = polygons;
        }

        rings.forEach((ring: any) => {
          const path = ring.map((c: number[]) => convertCoord(c[0], c[1]));
          paths.push(path);

          // 좌표(x,y)가 없는 경우(건물 등) 중심점 계산
          if (!props.x || !props.y) {
            try {
              // Calculate center for the first ring (simplified)
              if (!centerPoint) {
                const [lng, lat] = polylabel([ring], 1.0);
                centerPoint = convertCoord(lng, lat);
              }
            } catch (e) {
              // fallback
            }
          }
        });
      }

      // 3. 마커 위치 결정
      let position;
      if (props.x && props.y) {
        position = convertCoord(Number(props.x), Number(props.y));
      } else if (centerPoint) {
        position = centerPoint;
      }

      // 4. 그리기
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
          strokeWeight,
          strokeColor,
          strokeOpacity,
          fillColor,
          fillOpacity,
        });
        polygon.setMap(map);
        polygonsRef.current.push(polygon);

        // Click Event
        const label = props.adm_nm || props.buld_nm || 'Unknown';
        window.kakao.maps.event.addListener(polygon, 'click', () => {
          console.log(`Clicked: ${label}`);
          setSelectedArea(props);
          if (clickRef.current) {
            clickRef.current(label);
          }
        });
      });

      // 5. 마커(오버레이)
      if (position) {
        const name = props.adm_nm || props.buld_nm || '데이터없음';
        const shortName = name.split(' ').pop();

        const contentEl = document.createElement('div');
        contentEl.innerHTML = `<div style="text-align: center; white-space: nowrap; padding: 4px 8px; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 12px; font-weight: bold; color: #333; cursor: pointer;">${shortName}</div>`;

        contentEl.onclick = () => {
          console.log('Clicked Overlay:', props);
          setSelectedArea(props);
          if (clickRef.current) {
            clickRef.current(name);
          }
        };

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: contentEl,
          yAnchor: 1, // 마커 밑부분이 좌표에 닿게
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
