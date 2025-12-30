import {
  KakaoMap,
  AdminArea,
  BuildingArea,
  CommercialArea,
  KakaoLatLng,
  InfoBarData,
  KakaoPolygon,
  KakaoCustomOverlay,
  PolygonStyle,
} from '../types/map-types';
import { convertCoord } from './map-utils';
import polylabel from '@mapbox/polylabel';

// React 의존성을 제거하기 위한 로컬 Ref 타입 정의
interface Ref<T> {
  current: T;
}

// 상권 타입별 스타일 정의 (Urban Chic)
// 상권 타입별 스타일 정의 (Urban Chic)
const COMMERCIAL_STYLES: Record<
  string,
  { normal: PolygonStyle; hover: PolygonStyle }
> = {
  발달상권: {
    normal: {
      strokeColor: '#1e1b4b', // Indigo 900
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#c7d2fe', // Indigo 200
      fillOpacity: 0.4,
    },
    hover: {
      strokeColor: '#0f172a', // Navy / Indigo 950
      strokeWeight: 3,
      strokeOpacity: 1.0,
      fillColor: '#a5b4fc', // Indigo 300
      fillOpacity: 0.55,
    },
  },
  골목상권: {
    normal: {
      strokeColor: '#475569', // Slate 600
      strokeWeight: 1.5,
      strokeOpacity: 0.8,
      fillColor: '#cbd5e1', // Slate 300
      fillOpacity: 0.2,
    },
    hover: {
      strokeColor: '#1f2933', // Slate 800
      strokeWeight: 2.5,
      strokeOpacity: 1.0,
      fillColor: '#94a3b8', // Slate 400
      fillOpacity: 0.45,
    },
  },
  전통시장: {
    normal: {
      strokeColor: '#134e4a', // Teal 800
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#b2e8e2', // Teal 200 (Custom)
      fillOpacity: 0.4,
    },
    hover: {
      strokeColor: '#042f2e', // Teal 950
      strokeWeight: 2.5,
      strokeOpacity: 1.0,
      fillColor: '#5eead4', // Teal 300
      fillOpacity: 0.55,
    },
  },
  관광특구: {
    normal: {
      strokeColor: '#581c87', // Purple 800
      strokeWeight: 3,
      strokeOpacity: 0.8,
      fillColor: '#c084fc', // Purple 400
      fillOpacity: 0.45,
    },
    hover: {
      strokeColor: '#3b0764', // Purple 950
      strokeWeight: 4,
      strokeOpacity: 1.0,
      fillColor: '#a855f7', // Purple 500
      fillOpacity: 0.65,
    },
  },
};

// 통합된 폴리곤 그리기 함수 (GeoJSON/CustomArea  모두 처리)
/* @param map Kakao 지도 객체
 * @param features 데이터 배열 (AdminArea[] 또는 BuildingArea[])
 * @param type 'admin' (행정구역) 또는 'building_store' (건물) - 스타일 결정용
 * @param polygonsRef 폴리곤 객체들을 저장할 Ref (cleanup용)
 * @param customOverlaysRef 커스텀 오버레이 객체들을 저장할 Ref (cleanup용)
 * @param onPolygonClick 폴리곤 클릭 시 실행할 콜백
 */
export function drawPolygons(
  map: KakaoMap,
  features: AdminArea[] | BuildingArea[] | CommercialArea[],
  type: 'admin' | 'building_store' | 'commercial',
  polygonsRef: Ref<KakaoPolygon[]>,
  customOverlaysRef: Ref<KakaoCustomOverlay[]>,
  onPolygonClick: (data: InfoBarData) => void,
  shouldClear: boolean = true,
) {
  // Clear existing polygons and overlays

  if (shouldClear) {
    polygonsRef.current.forEach((poly) => poly.setMap(null));
    polygonsRef.current = [];
    customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    customOverlaysRef.current = [];
  }

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
          } catch (err) {
            console.error('Polylabel calculation failed:', err);
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
      let normalStyle: PolygonStyle = {
        strokeColor: '#4A90E2',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#D1E8FF',
        fillOpacity: 0.5,
      };

      let hoverStyle: PolygonStyle = { ...normalStyle }; // 기본값

      // 행정구역(Admin)일 때의 초기 스타일 (투명하게)
      if (type === 'admin') {
        normalStyle = {
          strokeColor: '#999999',
          strokeWeight: 2,
          strokeOpacity: 0.0,
          fillColor: '#D1E8FF', // Admin은 fill color가 크게 중요치 않음 (투명해서)
          fillOpacity: 0.01,
        };
        hoverStyle = {
          strokeColor: '#2563eb', // 선명한 블루
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: '#e2e8f0', // 차분한 슬레이트 블루
          fillOpacity: 0.6,
        };
      } else if (type === 'building_store') {
        // 중첩 허용을 위해 아주 낮은 투명도 설정 (밀도 시각화)
        normalStyle = {
          strokeColor: '#6b7280', // Gray 500
          strokeWeight: 1,
          strokeOpacity: 0.5,
          fillColor: '#374151', // Gray 700
          fillOpacity: 0.05, // 5% Opacity - 겹치면 진해짐
        };
        // 건물 호버 스타일
        hoverStyle = {
          strokeColor: '#374151', // Gray 700
          strokeWeight: 1.5,
          strokeOpacity: 0.9,
          fillColor: '#4b5563', // Gray 600
          fillOpacity: 0.4,
        };
      } else if (type === 'commercial') {
        const commercialProps = props as CommercialArea;
        const typeName = commercialProps.commercialType;
        const styles = COMMERCIAL_STYLES[typeName];

        if (styles) {
          normalStyle = styles.normal;
          hoverStyle = styles.hover;
        }
      }

      const polygon = new window.kakao.maps.Polygon({
        path: path,
        ...normalStyle,
      });
      polygon.setMap(map);
      polygonsRef.current.push(polygon);

      // Hover Effects Application
      // 모든 타입에 대해 호버 효과 적용 (건물 포함)
      window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
        polygon.setOptions(hoverStyle);
      });

      window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
        polygon.setOptions(normalStyle);
      });

      // Click Event
      let label = 'Unknown';
      if ('buld_nm' in props) label = (props as BuildingArea).buld_nm;
      else if ('adm_nm' in props) label = (props as AdminArea).adm_nm;
      else if ('commercialName' in props)
        label = (props as CommercialArea).commercialName;

      window.kakao.maps.event.addListener(polygon, 'click', () => {
        console.log(`Clicked: ${label}`);

        const x = centerPoint ? centerPoint.getLng() : 0;
        const y = centerPoint ? centerPoint.getLat() : 0;

        // TODO: InfoBar에 상권 정보(TRDAR_SE_1 등)가 포함된 props를 전달하는 부분.
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
      if (type === 'building_store') return;

      let shortName = '데이터없음';
      if ('buld_nm' in props && props.buld_nm) shortName = props.buld_nm;
      else if ('adm_nm' in props && props.adm_nm)
        shortName = props.adm_nm.split(' ').pop() || '';
      else if ('commercialName' in props && props.commercialName)
        shortName = props.commercialName;

      // Add Revenue Display if available
      if (
        'revenue' in props &&
        typeof props.revenue === 'number' &&
        props.revenue > 0
      ) {
        const revenueInBillions = Math.round(props.revenue / 100000000);
        shortName += ` <span style="color: #2563eb;">${revenueInBillions.toLocaleString()}억</span>`;
      }

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
