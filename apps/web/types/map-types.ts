export interface KakaoMap {
  getLevel: () => number;
  setLevel: (level: number) => void;
  setCenter: (latlng: any) => void;
  getCenter: () => any;
}

export interface KakaoPolygon {
  setMap: (map: KakaoMap | null) => void;
}

export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][]; // Polygon or MultiPolygon coordinates
}

export interface GeoJSONProperties {
  adm_nm?: string;
  buld_nm?: string;
  tot_oa_cd?: string;
  [key: string]: unknown;
}

export interface GeoJSONFeature {
  type: string;
  geometry: GeoJSONGeometry;
  properties: GeoJSONProperties;
}

export interface InfoBarData {
  adm_nm?: string;
  buld_nm?: string;
  adm_cd?: string;
  tot_oa_cd?: string;
  x?: string | number;
  y?: string | number;
  [key: string]: any;
}
