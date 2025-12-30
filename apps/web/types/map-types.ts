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
  getProjection: () => KakaoMapProjection;
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

export type KakaoEventHandle = any;
export type KakaoEventHandler = (...args: any[]) => void;

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

export interface AdminArea {
  adm_nm: string;
  adm_cd: string;
  x: string | number;
  y: string | number;
  polygons: number[][][][] | number[][][] | number[][];
}

export interface BuildingArea {
  buld_nm: string;
  x: string | number;
  y: string | number;
  polygons: number[][][][] | number[][][] | number[][];
}

export interface CommercialArea {
  commercialType: string;
  commercialName: string;
  commercialCode: string;
  guCode: string;
  dongCode: string;
  polygons: number[][][][] | number[][][] | number[][];
}

export interface CommercialApiResponse {
  properties: {
    commercialType: string;
    commercialName: string;
    commercialCode: string;
    guCode: string;
    dongCode: string;
  };
  polygons: {
    coordinates: number[][][][] | number[][][] | number[][];
  };
}

export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
}

export interface PolygonClickData {
  name: string;
  code?: string;
}
