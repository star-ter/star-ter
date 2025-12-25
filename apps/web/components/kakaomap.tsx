'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { initProj4, convertCoord } from '../utils/map-utils';
import { KakaoMap, KakaoPolygon, GeoJSONFeature } from '../types/map-types';

initProj4();

declare global {
  interface Window {
    kakao: any;
  }
}

export default function Kakaomap({ polygonClick = (area: string) => {} }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const polygonsRef = useRef<KakaoPolygon[]>([]);
  const lastLevelGroupRef = useRef<string | null>(null);

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
    // Clear existing
    polygonsRef.current.forEach((poly) => poly.setMap(null));
    polygonsRef.current = [];

    features.forEach((feature: GeoJSONFeature) => {
      const geometry = feature.geometry;
      const props = feature.properties;
      const paths: any[] = [];

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
        });
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

        const label =
          props.adm_nm || props.tot_oa_cd || props.buld_nm || 'Unknown';

        window.kakao.maps.event.addListener(polygon, 'click', () => {
          console.log(`Clicked: ${label}`);

          if (clickRef.current) {
            clickRef.current(label);
          }
        });
      });
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
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <div
        ref={mapRef}
        className="w-full h-100 border border-gray-200 rounded-lg"
        style={{ width: '100vw', height: '100vh' }}
      />
    </>
  );
}
