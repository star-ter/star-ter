import {
  KakaoMap,
  AdminArea,
  BuildingArea,
  CommercialArea,
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
  features: AdminArea[] | BuildingArea[] | CommercialArea[],
  type: 'admin' | 'vworld_building' | 'commercial',
  polygonsRef: Ref<KakaoPolygon[]>,
  customOverlaysRef: Ref<KakaoCustomOverlay[]>,
  onPolygonClick: (data: InfoBarData) => void,
) {
  // Clear existing polygons and overlays
  polygonsRef.current.forEach((poly) => poly.setMap(null));
  polygonsRef.current = [];
  customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
  customOverlaysRef.current = [];

  features.forEach((feature: AdminArea | BuildingArea | CommercialArea) => {
    const { polygons, ...props } = feature;
    const paths: KakaoLatLng[][] = [];
    let centerPoint: KakaoLatLng | null = null;

    if (polygons && Array.isArray(polygons) && polygons.length > 0) {
      let rings: number[][][] = [];
      const first = polygons[0];

      // Check depth to determine structure
      let isLevel4 = false;
      let isLevel2 = false;

      if (Array.isArray(first)) {
        const second = first[0];
        if (Array.isArray(second)) {
          const third = second[0];
          if (Array.isArray(third)) {
            isLevel4 = true;
          }
        } else if (typeof second === 'number') {
          isLevel2 = true;
        }
      }

      if (isLevel4) {
        // 4 Levels
        (polygons as number[][][][]).forEach((poly) => {
          if (Array.isArray(poly)) {
            poly.forEach((ring) => rings.push(ring));
          }
        });
      } else if (isLevel2) {
        // 2 Levels (Single Ring directly) - DB data case
        rings.push(polygons as unknown as number[][]);
      } else {
        // 3 Levels (Default GeoJSON Polygon)
        rings = polygons as number[][][];
      }

      rings.forEach((ring) => {
        const path = ring.map((c: number[]) => convertCoord(c[0], c[1]));
        paths.push(path);

        // 건물의 중심점 계산
        // x, y 정보가 없으면 polylabel로 계산
        // x, y가 존재하는지 확인 (Type Guard)
        const hasXY = 'x' in props && 'y' in props && props.x && props.y;

        if (!hasXY) {
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
    }

    if (!position && centerPoint) {
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
      } else if (type === 'commercial') {
        const commercialProps = props as CommercialArea;
        const typeName = commercialProps.TRDAR_SE_1;

        if (typeName === '발달상권') {
          strokeColor = '#D500F9'; // 강렬한 보라색
          fillColor = '#E040FB'; // 밝은 보라색
        } else if (typeName === '골목상권') {
          strokeColor = '#FF6D00'; // 진한 오렌지
          fillColor = '#FFAB40'; // 밝은 오렌지
        } else if (typeName === '전통시장') {
          strokeColor = '#00C853'; // 진한 녹색
          fillColor = '#69F0AE'; // 밝은 민트색
        } else if (typeName === '관광특구') {
          strokeColor = '#00B0FF'; // 진한 하늘색
          fillColor = '#40C4FF'; // 밝은 하늘색
        }
        fillOpacity = 0.4;
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
      let label = 'Unknown';
      if ('buld_nm' in props) label = (props as BuildingArea).buld_nm;
      else if ('adm_nm' in props) label = (props as AdminArea).adm_nm;
      else if ('TRDAR_CD_N' in props)
        label = (props as CommercialArea).TRDAR_CD_N;

      window.kakao.maps.event.addListener(polygon, 'click', () => {
        console.log(`Clicked: ${label}`);

        const x = centerPoint ? centerPoint.getLng() : 0;
        const y = centerPoint ? centerPoint.getLat() : 0;

        // TODO: InfoBar에 상권 정보(TRDAR_SE_1 등)가 포함된 props를 전달하는 부분.
        // 현재 ...props로 모든 필드(TRDAR_SE_1, TRDAR_CD_N 등)가 넘어가고 있음.
        onPolygonClick({
          ...props,
          x: x,
          y: y,
          polygons: polygons,
        } as unknown as InfoBarData);
      });
    });

    // 5. 마커(오버레이)
    if (position) {
      if (type === 'vworld_building') return;

      let shortName = '데이터없음';
      if ('buld_nm' in props && props.buld_nm) shortName = props.buld_nm;
      else if ('adm_nm' in props && props.adm_nm)
        shortName = props.adm_nm.split(' ').pop() || '';
      else if ('TRDAR_CD_N' in props && props.TRDAR_CD_N)
        shortName = props.TRDAR_CD_N;

      const contentEl = document.createElement('div');
      contentEl.innerHTML = `<div style="text-align: center; white-space: nowrap; padding: 4px 8px; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 12px; font-weight: bold; color: #333; cursor: pointer;">${shortName}</div>`;

      contentEl.onclick = () => {
        console.log('Clicked Overlay:', props);
        // TODO: Overlay 클릭 시에도 InfoBar에 상권 정보 전달
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
