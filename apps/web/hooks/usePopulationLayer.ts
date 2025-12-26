import { useEffect, useState, useCallback, useRef } from 'react';
import { KakaoMap, KakaoPolygon, KakaoLatLng } from '../types/map-types';
import {
  PopulationRow,
  GenderFilter,
  AgeFilter,
} from '../types/population-types';

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    CELL_ID: string;
    [key: string]: string | number | undefined;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface GridGeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export const usePopulationLayer = (
  map: KakaoMap | null,
  populationData: PopulationRow[],
  genderFilter: GenderFilter,
  ageFilter: AgeFilter,
  getPopulationValue: (
    row: PopulationRow,
    gender: GenderFilter,
    age: AgeFilter,
  ) => number,
  getColorByValue: (value: number, max: number) => string,
) => {
  const [geoJson, setGeoJson] = useState<GridGeoJSON | null>(null);
  const polygonsRef = useRef<KakaoPolygon[]>([]);

  // 1. GeoJSON 데이터 로드
  useEffect(() => {
    fetch('/data/seoul_grid_250m.geojson')
      .then((res) => res.json())
      .then((data) => setGeoJson(data as GridGeoJSON))
      .catch((err) => console.error('Grid GeoJSON Load Error:', err));
  }, []);

  // 2. 폴리곤 초기화 및 갱신 로직
  const updatePolygons = useCallback(() => {
    if (!map || !geoJson || populationData.length === 0) return;

    // Feature Map 생성 (성능 최적화: find 대신 Map 사용)
    const featureMap = new Map<string, GeoJSONFeature>();
    geoJson.features.forEach((f) => featureMap.set(f.properties.CELL_ID, f));

    // 기존 폴리곤 제거
    polygonsRef.current.forEach((polygon) => polygon.setMap(null));
    polygonsRef.current = [];

    // 최대값 계산 (색상 스케일용)
    const values = populationData.map((row) =>
      getPopulationValue(row, genderFilter, ageFilter),
    );
    const maxValue = Math.max(...values, 1);

    const newPolygons: KakaoPolygon[] = [];

    // 데이터 Join 및 매핑
    let matchCount = 0;
    populationData.forEach((row) => {
      const feature = featureMap.get(row.CELL_ID);
      if (!feature) return;

      matchCount++;
      const value = getPopulationValue(row, genderFilter, ageFilter);
      const color = getColorByValue(value, maxValue);

      // 좌표 변환 (GeoJSON [lng, lat] -> Kakao LatLng)
      const paths: KakaoLatLng[][] = [];
      const geometry = feature.geometry;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates as number[][][];
        paths.push(
          coords[0].map(
            (coord) => new window.kakao.maps.LatLng(coord[1], coord[0]),
          ),
        );
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates as number[][][][];
        coords.forEach((poly) => {
          paths.push(
            poly[0].map(
              (coord) => new window.kakao.maps.LatLng(coord[1], coord[0]),
            ),
          );
        });
      }

      const polygon = new window.kakao.maps.Polygon({
        path: paths,
        strokeWeight: 1,
        strokeColor: '#004c80',
        strokeOpacity: 0.1,
        fillColor: color,
        fillOpacity: 0.4,
      });

      polygon.setMap(map);
      newPolygons.push(polygon);
    });

    console.log(`[PopulationLayer] Matched ${matchCount}/${populationData.length} cells. Max value: ${maxValue}`);
    polygonsRef.current = newPolygons;
  }, [map, geoJson, populationData, genderFilter, ageFilter, getPopulationValue, getColorByValue]);

  // 데이터나 필터가 바뀔 때마다 갱신
  useEffect(() => {
    updatePolygons();
    return () => {
      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
    };
  }, [updatePolygons]);

  return { geoJsonLoaded: !!geoJson };
};
