'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import proj4 from 'proj4';

// Define SGIS Layout (UTM-K)
if (typeof window !== 'undefined' && !proj4.defs('EPSG:5179')) {
  proj4.defs(
    'EPSG:5179',
    '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  );
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function Kakaomap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const polygonsRef = useRef<any[]>([]);
  const lastLevelGroupRef = useRef<string | null>(null);

  // Use the NestJS Backend URL
  const API_BASE_URL = 'http://localhost:4000';

  useEffect(() => {
    if (loaded && window.kakao && window.kakao.maps && mapRef.current) {
      window.kakao.maps.load(() => {
        initMap();
      });
    }
  }, [loaded]);

  const initMap = () => {
    const container = mapRef.current;
    if (!container) return;

    const options = {
      center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // Seoul City Hall
      level: 8,
    };

    const map = new window.kakao.maps.Map(container, options);

    // Initial Load
    refreshLayer(map);

    // Debounce refresh
    let timeoutId: any = null;
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

  const refreshLayer = (map: any) => {
    const level = map.getLevel();
    console.log(`Current Zoom Level: ${level}`);

    let currentGroup = '';
    if (level >= 7) currentGroup = 'GU';
    else if (level >= 5) currentGroup = 'DONG';
    else if (level >= 3) currentGroup = 'USER';
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
      fetchCombinedBoundary(map, 1, 'Gu'); // Seoul(11) Only
    } else if (level >= 5) {
      fetchCombinedBoundary(map, 2, 'Dong'); // Seoul(11) Dong
    } else if (level >= 3) {
      fetchUserArea(map, '4'); // Jipgyegu
    } else {
      // V-World Building
      fetchVWorldBuilding(map);
    }
  };

  const fetchVWorldBuilding = (map: any) => {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // V-World also uses EPSG:4326 (WGS84) for requests usually, or could be 3857.
    // However, the service implementation expects raw coordinates.
    // Based on legacy code usage: "minx=sw.getLng()..." it seems to send WGS84.
    const minx = sw.getLng();
    const miny = sw.getLat();
    const maxx = ne.getLng();
    const maxy = ne.getLat();

    console.log(`Fetching V-World Building Data...`);

    fetch(
      `${API_BASE_URL}/vworld/building?minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}`,
    )
      .then((res) => res.json())
      .then((data) => {
        // V-World response structure: response.result.featureCollection.features
        if (
          data.response &&
          data.response.status === 'OK' &&
          data.response.result &&
          data.response.result.featureCollection &&
          data.response.result.featureCollection.features
        ) {
          const features = data.response.result.featureCollection.features;
          console.log(`Received ${features.length} V-World buildings`);
          drawPolygons(map, features, 'vworld_building');
        } else {
          console.warn(
            'V-World API No Data or Error:',
            JSON.stringify(data, null, 2),
          );
        }
      })
      .catch((err) => console.error('V-World Fetch Error:', err));
  };

  const fetchCombinedBoundary = async (
    map: any,
    lowSearch: number,
    label: string,
  ) => {
    console.log(`Fetching Combined Boundary (${label})...`);
    try {
      const url = `${API_BASE_URL}/sgis/boundary?low_search=${lowSearch}&adm_cd=11`;

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

  const fetchUserArea = (map: any, cd: string) => {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Convert WGS84 (Kakao) -> UTM-K (SGIS) using proj4
    const [minx, miny] = proj4('EPSG:4326', 'EPSG:5179', [
      sw.getLng(),
      sw.getLat(),
    ]);
    const [maxx, maxy] = proj4('EPSG:4326', 'EPSG:5179', [
      ne.getLng(),
      ne.getLat(),
    ]);

    console.log(`Fetching UserArea (cd=${cd})...`);

    fetch(
      `${API_BASE_URL}/sgis/userarea?minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}&cd=${cd}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          console.log(`Received ${data.features.length} features (cd=${cd})`);
          drawPolygons(map, data.features, 'user');
        } else if (data.status === 412) {
          console.warn(
            'Area too large via UserAPI. Switching to Dong fallback.',
          );
          fetchCombinedBoundary(map, 2, 'Dong (Fallback)');
        }
      })
      .catch((err) => console.error('Fetch Error:', err));
  };

  const drawPolygons = (
    map: any,
    features: any[],
    type: 'admin' | 'user' | 'vworld_building',
  ) => {
    // Clear existing
    polygonsRef.current.forEach((poly) => poly.setMap(null));
    polygonsRef.current = [];

    features.forEach((feature: any) => {
      const geometry = feature.geometry;
      const props = feature.properties;
      const paths: any[] = [];

      const convertCoord = (x: number, y: number) => {
        if (x > 180) {
          const [lng, lat] = proj4('EPSG:5179', 'EPSG:4326', [x, y]);
          return new window.kakao.maps.LatLng(lat, lng);
        }
        return new window.kakao.maps.LatLng(y, x);
      };

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
        const isUserArea = type === 'user';

        let strokeColor = '#2c5bf0';
        let fillColor = '#a0cfff';
        let fillOpacity = 0.4;
        let strokeOpacity = 0.8;
        let strokeWeight = 2;

        if (isUserArea) {
          strokeColor = '#ff0000';
          fillColor = '#ffcccc';
          fillOpacity = 0.2;
          strokeWeight = 1;
        } else if (type === 'vworld_building') {
          strokeColor = '#FF8C00';
          fillColor = '#FFA500';
          fillOpacity = 0.5;
        }

        if (type === 'admin') {
          strokeColor = '#4A90E2';
          fillColor = '#D1E8FF';
          fillOpacity = 0.5;
          strokeWeight = 2;
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

        const label = props.adm_nm || props.tot_oa_cd || 'Unknown';

        // Simple click event
        window.kakao.maps.event.addListener(polygon, 'click', () => {
          console.log(`Clicked: ${label}`);
        });
      });
    });
  };

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <div
        ref={mapRef}
        className="w-full h-[400px] border border-gray-200 rounded-lg"
        style={{ width: '100vw', height: '100vh' }}
      />
    </>
  );
}
