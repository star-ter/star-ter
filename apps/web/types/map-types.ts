export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoBounds {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
  contain: (latlng: KakaoLatLng) => boolean;
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
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
}

export interface InfoBarData {
  adm_nm?: string;
  adm_cd?: string;
  buld_nm?: string;
  x?: string | number;
  y?: string | number;
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
    LatLngBounds: new () => KakaoBounds;
    Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
    Polygon: new (options: Record<string, unknown>) => KakaoPolygon;
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
