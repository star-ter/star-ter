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
  setOptions: (options: PolygonStyle | Record<string, unknown>) => void;
  fillColor?: string; // 성능 최적화를 위한 컬러 캐싱용
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
  // [key: string]: any;
}

// 행정구역
export interface AdminArea {
  adm_cd: number;
  adm_nm: string;
  x: number;
  y: number;
  polygons: number[][][][] | number[][][] | number[][];
  revenue?: number; // 매출 (Optional)
}

// 건물
export interface BuildingArea {
  buld_nm: string;
  adm_nm: string;
  polygons: number[][][][] | number[][][] | number[][];
}

// 상권
export interface CommercialArea {
  commercialType: string;
  commercialName: string;
  commercialCode: string;
  guCode: string; // 구 정보
  dongCode: string; // 동 정보
  polygons: number[][][][] | number[][][] | number[][];
  revenue?: number; // 매출 (Optional)
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
}
