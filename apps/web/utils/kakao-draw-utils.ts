import {
  KakaoMap,
  AdminArea,
  CommercialArea,
  KakaoLatLng,
  InfoBarData,
  KakaoPolygon,
  KakaoCustomOverlay,
  PolygonStyle,
  Ref,
  MapFeature,
  MapFeatureType,
  OverlayMode,
} from '../types/map-types';
import { convertCoord } from './map-utils';
import polylabel from '@mapbox/polylabel';

const centerCache = new WeakMap<object, KakaoLatLng>();

const COMMERCIAL_STYLES: Record<
  string,
  { normal: PolygonStyle; hover: PolygonStyle }
> = {
  발달상권: {
    normal: {
      strokeColor: '#1e1b4b',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#c7d2fe',
      fillOpacity: 0.4,
    },
    hover: {
      strokeColor: '#0f172a',
      strokeWeight: 3,
      strokeOpacity: 1.0,
      fillColor: '#a5b4fc',
      fillOpacity: 0.55,
    },
  },
  골목상권: {
    normal: {
      strokeColor: '#475569',
      strokeWeight: 1.5,
      strokeOpacity: 0.8,
      fillColor: '#cbd5e1',
      fillOpacity: 0.2,
    },
    hover: {
      strokeColor: '#1f2933',
      strokeWeight: 2.5,
      strokeOpacity: 1.0,
      fillColor: '#94a3b8',
      fillOpacity: 0.45,
    },
  },
  전통시장: {
    normal: {
      strokeColor: '#134e4a',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#b2e8e2',
      fillOpacity: 0.4,
    },
    hover: {
      strokeColor: '#042f2e',
      strokeWeight: 2.5,
      strokeOpacity: 1.0,
      fillColor: '#5eead4',
      fillOpacity: 0.55,
    },
  },
  관광특구: {
    normal: {
      strokeColor: '#581c87',
      strokeWeight: 3,
      strokeOpacity: 0.8,
      fillColor: '#c084fc',
      fillOpacity: 0.45,
    },
    hover: {
      strokeColor: '#3b0764',
      strokeWeight: 4,
      strokeOpacity: 1.0,
      fillColor: '#a855f7',
      fillOpacity: 0.65,
    },
  },
};

function isRankableFeature(f: MapFeature): f is AdminArea | CommercialArea {
  return (
    'revenue' in f ||
    'residentPopulation' in f ||
    'openingStores' in f ||
    'closingStores' in f
  );
}

function getTop3Features(
  features: MapFeature[],
  mode: OverlayMode,
): Map<MapFeature, number> {
  const hasServerRanking = features.some(
    (f) =>
      'rankRevenue' in f ||
      'rankPopulation' in f ||
      'rankOpening' in f ||
      'rankClosing' in f,
  );

  if (hasServerRanking) {
    const top3Map = new Map<MapFeature, number>();
    features.forEach((f) => {
      let rank: number | undefined;
      if (mode === 'revenue' && 'rankRevenue' in f) rank = f.rankRevenue;
      if (mode === 'population' && 'rankPopulation' in f)
        rank = f.rankPopulation;
      if (mode === 'opening' && 'rankOpening' in f) rank = f.rankOpening;
      if (mode === 'shutting' && 'rankClosing' in f) rank = f.rankClosing;

      if (rank !== undefined && rank <= 3) {
        top3Map.set(f, rank);
      }
    });
    return top3Map;
  }

  const validFeatures = features.filter(
    (f): f is AdminArea | CommercialArea => {
      if (!isRankableFeature(f)) return false;

      if (mode === 'revenue') {
        return (f.revenue || 0) > 0;
      }
      if (mode === 'population') {
        return (f.residentPopulation || 0) > 0;
      }
      if (mode === 'opening') {
        return (f.openingStores || 0) > 0;
      }
      if (mode === 'shutting') {
        return (f.closingStores || 0) >= 0;
      }
      return false;
    },
  );

  const sortedFeatures = validFeatures
    .sort((a, b) => {
      if (mode === 'revenue') return (b.revenue || 0) - (a.revenue || 0);
      if (mode === 'population')
        return (b.residentPopulation || 0) - (a.residentPopulation || 0);
      if (mode === 'opening')
        return (b.openingStores || 0) - (a.openingStores || 0);
      if (mode === 'shutting')
        return (a.closingStores || 0) - (b.closingStores || 0); // Ascending sort for least closures
      return 0;
    })
    .slice(0, 3);

  const top3Map = new Map<MapFeature, number>();
  sortedFeatures.forEach((f, index) => {
    top3Map.set(f, index + 1);
  });
  return top3Map;
}

function getShortName(feature: MapFeature): string {
  if ('buld_nm' in feature && feature.buld_nm) return feature.buld_nm;
  if ('adm_nm' in feature && feature.adm_nm)
    return feature.adm_nm.split(' ').pop() || '';
  if ('commercialName' in feature && feature.commercialName)
    return feature.commercialName;
  return 'Unknown';
}

function getValueTag(feature: MapFeature, mode: OverlayMode): string {
  if (!isRankableFeature(feature)) return '';

  if (mode === 'revenue' && feature.revenue) {
    const revenueInBillions = Math.round(feature.revenue / 100000000);
    return ` <span style="color: #2563eb;">${revenueInBillions.toLocaleString()}억</span>`;
  }
  if (mode === 'population' && feature.residentPopulation) {
    const pop = Math.round(feature.residentPopulation);
    return ` <span style="color: #2563eb;">${pop.toLocaleString()}명</span>`;
  }
  if (mode === 'opening' && feature.openingStores) {
    const count = Math.round(feature.openingStores);
    return ` <span style="color: #2563eb;">${count.toLocaleString()}개</span>`;
  }
  if (mode === 'shutting' && feature.closingStores !== undefined) {
    const count = Math.round(feature.closingStores);
    return ` <span style="color: #2563eb;">${count.toLocaleString()}개</span>`;
  }
  return '';
}

function createMarkerContent(
  feature: MapFeature,
  isTop3: boolean,
  ranking: number | undefined,
  mode: OverlayMode,
  isHotSpot: boolean,
): HTMLElement {
  const shortName = getShortName(feature) + getValueTag(feature, mode);

  const contentEl = document.createElement('div');

  let iconMarker = '';
  let boxStyle =
    'background: white; border: 1px solid #ccc; color: #333; padding: 4px 8px; font-weight: bold;';
  let zIndexStyle = '';

  let hotSpotIcon = '';
  if (isHotSpot) {
    // Star icon logic removed as per user request
    hotSpotIcon = '';
  }

  if (isTop3) {
    iconMarker = `
    <div style="position: absolute; top: -34px; left: 50%; transform: translateX(-50%); z-index: 20;">
      <div style="background: #3f78f4ff; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 900; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">
        TOP ${ranking}
      </div>
      <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #3f78f4ff;"></div>
    </div>`;

    boxStyle =
      'background: white; border: 3px solid #3f78f4ff; color: #333; padding: 6px 12px; font-weight: 800; transform: scale(1.1); z-index: 10;';
    zIndexStyle = 'z-index: 10;';
  }

  contentEl.innerHTML = `
    <div style="position: relative; ${zIndexStyle}">
      ${iconMarker}
      ${hotSpotIcon}
      <div style="text-align: center; white-space: nowrap; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s; ${boxStyle} font-size: 13px;">
        ${shortName}
      </div>
    </div>
  `;

  return contentEl;
}

export function drawPolygons(
  map: KakaoMap,
  features: MapFeature[],
  type: MapFeatureType,
  polygonsRef: Ref<KakaoPolygon[]>,
  customOverlaysRef: Ref<KakaoCustomOverlay[]>,
  onPolygonClick: (data: InfoBarData) => void,
  shouldClear: boolean = true,
  mode: OverlayMode = 'revenue',
  level?: 'gu' | 'dong' | 'commercial' | 'sido',
  shouldDrawMarkers: boolean = true,
) {
  if (shouldClear) {
    polygonsRef.current.forEach((poly) => poly.setMap(null));
    polygonsRef.current = [];
    if (shouldDrawMarkers) {
      customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      customOverlaysRef.current = [];
    }
  }


  features.forEach((feature) => {
    const { polygons, ...props } = feature;

    const paths: KakaoLatLng[][] = [];
    let centerPoint: KakaoLatLng | null = null;

    if (polygons && Array.isArray(polygons) && polygons.length > 0) {
      let rings: number[][][] = [];
      const first = polygons[0];

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
        (polygons as number[][][][]).forEach((poly) => {
          if (Array.isArray(poly)) {
            poly.forEach((ring) => rings.push(ring));
          }
        });
      } else if (isLevel2) {
        rings.push(polygons as unknown as number[][]);
      } else {
        rings = polygons as number[][][];
      }

      rings.forEach((ring) => {
        const path = ring.map((c: number[]) => convertCoord(c[0], c[1]));
        paths.push(path);

        const hasXY = 'x' in props && 'y' in props && props.x && props.y;
        if (!hasXY && !centerPoint) {
          try {
            const [lng, lat] = polylabel([ring], 1.0);
            centerPoint = convertCoord(lng, lat);
          } catch (err) {
            console.error('Polylabel calculation failed:', err);
          }
        }
      });
    }

    let position;
    if ('x' in props && 'y' in props && props.x && props.y) {
      position = convertCoord(Number(props.x), Number(props.y));
    }
    if (!position && centerPoint) {
      position = centerPoint;
    }

    if (position) {
      centerCache.set(feature, position);
    }

    paths.forEach((path) => {
      let normalStyle: PolygonStyle = {
        strokeColor: '#4A90E2',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#D1E8FF',
        fillOpacity: 0.5,
      };

      let hoverStyle: PolygonStyle = { ...normalStyle };

      if (type === 'admin') {
        normalStyle = {
          strokeColor: '#999999',
          strokeWeight: 2,
          strokeOpacity: 0.0,
          fillColor: '#D1E8FF',
          fillOpacity: 0.01,
        };
        hoverStyle = {
          strokeColor: '#2563eb',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: '#e2e8f0',
          fillOpacity: 0.6,
        };
      } else if (type === 'building_store') {
        normalStyle = {
          strokeColor: '#6b7280',
          strokeWeight: 1,
          strokeOpacity: 0.5,
          fillColor: '#374151',
          fillOpacity: 0.05,
        };
        hoverStyle = {
          strokeColor: '#374151',
          strokeWeight: 1.5,
          strokeOpacity: 0.9,
          fillColor: '#4b5563',
          fillOpacity: 0.4,
        };
      } else if (type === 'commercial' && 'commercialType' in props) {
        const typeName = props.commercialType;
        const styles = COMMERCIAL_STYLES[typeName];
        if (styles) {
          normalStyle = styles.normal;
          hoverStyle = styles.hover;
        }
      } else if (type === 'sido') {
        // 서울시 전체 테두리 스타일
        normalStyle = {
          strokeColor: '#6961FF', // Black
          strokeWeight: 3, // 두꺼운 테두리
          strokeOpacity: 0.8,
          fillColor: '#FFFFFF',
          fillOpacity: 0, // 채우기 없음
        };
        hoverStyle = { ...normalStyle }; // 호버 시에도 유지
      }

    const polygon = new window.kakao.maps.Polygon({
        path: path,
        ...normalStyle,
      });
      polygon.setMap(map);
      polygonsRef.current.push(polygon);

      window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
        polygon.setOptions(hoverStyle);
      });

      window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
        polygon.setOptions(normalStyle);
      });

      window.kakao.maps.event.addListener(polygon, 'click', () => {
        const center = getCenterOfFeature(feature);
        const finalX = center ? center.getLng() : 0;
        const finalY = center ? center.getLat() : 0;

        onPolygonClick({
          ...props,
          x: finalX,
          y: finalY,
          polygons: polygons,
          level: level,
        } as unknown as InfoBarData);
      });
    });

    // Cache center point if calculated during polygon processing
    if (position) {
      centerCache.set(feature, position);
    }
  });

  if (shouldDrawMarkers) {
    drawMarkers(
      map,
      features,
      customOverlaysRef,
      onPolygonClick,
      mode,
      level,
    );
  }
}

function getCenterOfFeature(feature: MapFeature): KakaoLatLng | null {
  if (centerCache.has(feature)) {
    return centerCache.get(feature)!;
  }

  const { polygons, ...props } = feature;
  if ('x' in props && 'y' in props && props.x && props.y) {
    const pos = convertCoord(Number(props.x), Number(props.y));
    centerCache.set(feature, pos);
    return pos;
  }

  if (polygons && Array.isArray(polygons) && polygons.length > 0) {
      let rings: number[][][] = [];
      const first = polygons[0];

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
        (polygons as number[][][][]).forEach((poly) => {
          if (Array.isArray(poly)) {
            poly.forEach((ring) => rings.push(ring));
          }
        });
      } else if (isLevel2) {
        rings.push(polygons as unknown as number[][]);
      } else {
        rings = polygons as number[][][];
      }
      if (rings.length > 0) {
        try {
          const [lng, lat] = polylabel([rings[0]], 1.0);
          const pos = convertCoord(lng, lat);
          centerCache.set(feature, pos);
          return pos;
        } catch {
          // console.error('Polylabel failed', err);
        }
      }
  }
  return null;
}

export function drawMarkers(
  map: KakaoMap,
  features: MapFeature[],
  customOverlaysRef: Ref<KakaoCustomOverlay[]>,
  onPolygonClick: (data: InfoBarData) => void,
  mode: OverlayMode,
  level?: 'gu' | 'dong' | 'commercial' | 'sido',
) {
  customOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
  customOverlaysRef.current = [];

  const top3Map = getTop3Features(features, mode);

  features.forEach((feature) => {
    const position = getCenterOfFeature(feature);

    if (!position) return;

    const ranking = top3Map.get(feature);
    const isTop3 = !!ranking;

    const isHotSpot =
      'openingStores' in feature &&
      'closingStores' in feature &&
      (feature.openingStores || 0) > (feature.closingStores || 0);

    const contentEl = createMarkerContent(
      feature,
      isTop3,
      ranking,
      mode,
      isHotSpot,
    );

 
    const { polygons, ...props } = feature;

    contentEl.onclick = () => {
      onPolygonClick({
        ...props,
        x: position.getLng(),
        y: position.getLat(),
        level: level,
        polygons: polygons,
      } as unknown as InfoBarData);
    };

    const customOverlay = new window.kakao.maps.CustomOverlay({
      position: position,
      content: contentEl,
      yAnchor: 1,
      zIndex: isTop3 ? 100 : 1,
    });
    customOverlay.setMap(map);
    customOverlaysRef.current.push(customOverlay);
  });
}
