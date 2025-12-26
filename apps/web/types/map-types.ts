export interface KakaoMap {
  getLevel: () => number;
  setLevel: (level: number) => void;
  setCenter: (latlng: any) => void;
  getCenter: () => any;
}

export interface KakaoPolygon {
  setMap: (map: KakaoMap | null) => void;
}

export interface InfoBarData {
  adm_nm?: string;
  buld_nm?: string;
  adm_cd?: string;
  x?: string | number;
  y?: string | number;
  [key: string]: any;
}

export interface CustomArea {
  adm_nm?: string;
  buld_nm?: string;
  adm_cd?: string;
  x?: string | number;
  y?: string | number;
  polygons: any[]; // 구체적으로는 number[][][] (Polygon) | number[][][][] (MultiPolygon) 이지만 유연성을 위해 any[]

  [key: string]: any;
}
