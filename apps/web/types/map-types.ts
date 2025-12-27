export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoBounds {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
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
  x: string | number;
  y: string | number;
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
