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
  setLevel: (level: number) => void;
  setCenter: (latlng: KakaoLatLng) => void;
  getCenter: () => KakaoLatLng;
  getBounds: () => KakaoBounds;
  setBounds: (bounds: KakaoBounds) => void;
}

export interface KakaoPolygon {
  setMap: (map: KakaoMap | null) => void;
  setOptions: (options: Record<string, unknown>) => void;
  fillColor?: string; // 성능 최적화를 위한 컬러 캐싱용
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
}

export interface InfoBarData {
  adm_nm?: string;
  adm_cd?: string;
  buld_nm?: string;
  x: string | number;
  y: string | number;
  polygons?: number[][][][] | number[][][] | number[][];
  // [key: string]: any;
}

// 행정구역 (구, 동)
export interface AdminArea {
  adm_nm: string;
  adm_cd: string;
  x?: string | number;
  y?: string | number;
  polygons: number[][][][] | number[][][] | number[][];
  // [key: string]: any;
}

// 빌딩
export interface BuildingArea {
  buld_nm: string;
  adm_nm?: string;
  adm_cd?: string;
  x?: string | number;
  y?: string | number;
  polygons: number[][][][] | number[][][] | number[][];
  // [key: string]: any;
}
export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

export interface KakaoNamespace {
  maps: {
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    LatLngBounds: new (sw?: KakaoLatLng, ne?: KakaoLatLng) => KakaoBounds;
    Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
    Polygon: new (options: Record<string, unknown>) => KakaoPolygon;
    Marker: new (options: Record<string, unknown>) => { setMap: (map: KakaoMap | null) => void };
    load: (callback: () => void) => void;
    event: {
      addListener: (target: unknown, event: string, callback: () => void) => unknown;
      removeListener: (listener: unknown) => void;
    };
  };
}

declare global {
  interface Window {
    kakao: KakaoNamespace;
  }
}

// 상권
// 상권
export interface CommercialArea {
  commercialType: string;
  commercialName: string;
  guCode: string; // 구 정보
  dongCode: string; // 동 정보
  polygons: number[][][][] | number[][][] | number[][];
}

export interface CommercialApiResponse {
  properties: {
    commercialType: string;
    commercialName: string;
    guCode: string;
    dongCode: string;
  };
  polygons: {
    coordinates: number[][][][] | number[][][] | number[][];
  };
}
