export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoBounds {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
  contain: (latlng: KakaoLatLng) => boolean;
  extend: (latlng: KakaoLatLng) => void;
}

export interface KakaoMap {
  getLevel: () => number;
  setLevel: (
    level: number,
    options?: { animate?: boolean | { duration: number } }
  ) => void;
  setCenter: (latlng: KakaoLatLng) => void;
  panTo: (
    latlng: KakaoLatLng,
    options?: { animate?: boolean | { duration: number } }
  ) => void;
  getCenter: () => KakaoLatLng;
  getBounds: () => KakaoBounds;
  setBounds: (bounds: KakaoBounds) => void;
  getProjection: () => KakaoMapProjection;
  // Event listeners need explicit methods if accessed directly, mostly via window.kakao.maps.event
}

export interface KakaoMapProjection {
  containerPointFromCoords: (latlng: KakaoLatLng) => { x: number; y: number };
  coordsFromContainerPoint: (point: { x: number; y: number }) => KakaoLatLng;
}

export interface KakaoPolygon {
  setMap: (map: KakaoMap | null) => void;
  setOptions: (options: PolygonStyle | Record<string, unknown>) => void;
  fillColor?: string;
}

export interface PolygonStyle {
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
  fillColor: string;
  fillOpacity: number;
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
}

export type KakaoEventHandle = unknown;
export type KakaoEventHandler = (...args: unknown[]) => void;

// 행정구역
export interface AdminArea {
  adm_cd: number;
  adm_nm: string;
  x: number | string;
  y: number | string;
  polygons: number[][][][] | number[][][] | number[][];
  revenue?: number; // 매출 (Optional)
  residentPopulation?: number; // 주거인구 (Optional)
  openingStores?: number; // 개업 점포 수 (Optional)
}

// 건물
export interface BuildingArea {
  buld_nm: string;
  adm_nm?: string;
  x?: number | string;
  y?: number | string;
  polygons: number[][][][] | number[][][] | number[][];
}

// 상권
export interface CommercialArea {
  commercialType: string;
  commercialName: string;
  commercialCode: string;
  guCode: string;
  dongCode: string;
  polygons: number[][][][] | number[][][] | number[][];
  revenue?: number; // 매출 (Optional)
  residentPopulation?: number; // 주거인구 (Optional)
  openingStores?: number; // 개업 점포 수 (Optional)
}

export interface InfoBarData {
  adm_nm?: string;
  adm_cd?: string;
  buld_nm?: string;
  commercialName?: string;
  commercialType?: string;
  commercialCode?: string;
  x: string | number;
  y: string | number;
  polygons?: number[][][][] | number[][][] | number[][];
}

export interface CommercialApiResponse {
  properties: {
    commercialType: string;
    commercialName: string;
    commercialCode?: string; // Legacy field, might be empty or redundant
    guCode: string;
    dongCode: string;
  };
  code?: string; // New code field from flattened DTO part
  polygons: {
    coordinates: number[][][][] | number[][][] | number[][];
  };
  revenue?: number;
  residentPopulation?: number;
  openingStores?: number;
}

export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
}

export interface PolygonClickData {
  name: string;
  code?: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  roadAddress?: string;
  buildingName?: string;
}

export interface ReverseGeocodeResult {
  address: string;
  roadAddress?: string;
  guName?: string;
  dongName?: string;
}

// Utility Types (Moved from kakao-draw-utils.ts)
export interface Ref<T> {
  current: T;
}

export type MapFeature = AdminArea | BuildingArea | CommercialArea;
export type MapFeatureType = 'admin' | 'building_store' | 'commercial';
export type OverlayMode = 'revenue' | 'population' | 'opening';
