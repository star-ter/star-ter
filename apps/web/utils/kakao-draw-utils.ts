import {
  KakaoMap,
  AdminArea,
  BuildingArea,
  KakaoLatLng,
  InfoBarData,
  KakaoPolygon,
  KakaoCustomOverlay,
} from '../types/map-types';
import { convertCoord } from './map-utils';
import polylabel from '@mapbox/polylabel';

// React 의존성을 제거하기 위한 로컬 Ref 타입 정의
interface Ref<T> {
  current: T;
}

// 통합된 폴리곤 그리기 함수 (GeoJSON/CustomArea  모두 처리)
/* @param map Kakao 지도 객체
 * @param features 데이터 배열 (AdminArea[] 또는 BuildingArea[])
 * @param type 'admin' (행정구역) 또는 'vworld_building' (건물) - 스타일 결정용
 * @param polygonsRef 폴리곤 객체들을 저장할 Ref (cleanup용)
 * @param customOverlaysRef 커스텀 오버레이 객체들을 저장할 Ref (cleanup용)
 * @param onPolygonClick 폴리곤 클릭 시 실행할 콜백
 */
export function drawPolygons(
  map: KakaoMap,
  features: AdminArea[] | BuildingArea[],
  type: 'admin' | 'vworld_building',
  polygonsRef: Ref<KakaoPolygon[]>,
  customOverlaysRef: Ref<KakaoCustomOverlay[]>,
  onPolygonClick: (data: InfoBarData) => void,
) {
  // Clear existing polygons and overlays
  polygonsRef.current.forEach((poly) => poly.setMap(null));
  polygonsRef.current = [];
  customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
  customOverlaysRef.current = [];

  features.forEach((feature: AdminArea | BuildingArea) => {
    const { polygons, ...props } = feature;
    const paths: KakaoLatLng[][] = [];
    let centerPoint: KakaoLatLng | null = null;

    if (polygons && Array.isArray(polygons)) {
      let rings: number[][][] = [];
      const isMultiPolygon = Array.isArray((polygons as any)[0]?.[0]?.[0]);

      if (isMultiPolygon) {
        // 4 Levels
        (polygons as number[][][][]).forEach((poly) => {
          if (Array.isArray(poly)) {
            poly.forEach((ring) => rings.push(ring));
          }
        });
      } else if (
        polygons.length > 0 &&
        Array.isArray(polygons[0]) &&
        typeof polygons[0][0] === 'number'
      ) {
        // 2 Levels (Single Ring directly) - DB data case
        rings.push(polygons as unknown as number[][]);
      } else {
        // 3 Levels
        rings = polygons as number[][][];
      }

      rings.forEach((ring) => {
        const path = ring.map((c: number[]) => convertCoord(c[0], c[1]));
        paths.push(path);

        // 건물의 중심점 계산
        if (!props.x || !props.y) {
          try {
            // Calculate center for the first ring (simplified)
            if (!centerPoint) {
              const [lng, lat] = polylabel([ring], 1.0);
              centerPoint = convertCoord(lng, lat);
            }
          } catch {
            // fallback
          }
        }
      });
    }

    // 3. 마커 위치 결정
    let position;
    if ('x' in props && 'y' in props && props.x && props.y) {
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
      const buldNm = 'buld_nm' in props ? props.buld_nm : undefined;
      const label = props.adm_nm || buldNm || 'Unknown';
      window.kakao.maps.event.addListener(polygon, 'click', () => {
        console.log(`Clicked: ${label}`);
        onPolygonClick(props as unknown as InfoBarData);
      });
    });

    // 5. 마커(오버레이)
    if (position) {
      const buldNm =
        'buld_nm' in props && typeof props.buld_nm === 'string'
          ? props.buld_nm
          : undefined;

      if (type === 'vworld_building') {
        return;
      }

      // 건물 이름이 있으면 그걸 쓰고, 없으면 행정구역 명의 마지막 단어(예: 봉천동)를 씀
      const shortName =
        buldNm || (props.adm_nm || '').split(' ').pop() || '데이터없음';

      const contentEl = document.createElement('div');
      contentEl.innerHTML = `<div style="text-align: center; white-space: nowrap; padding: 4px 8px; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 12px; font-weight: bold; color: #333; cursor: pointer;">${shortName}</div>`;

      contentEl.onclick = () => {
        console.log('Clicked Overlay:', props);
        onPolygonClick(props as unknown as InfoBarData);
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
}
