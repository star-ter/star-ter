export interface PopulationRow {
  YMD: string;          // 조회 날짜
  TT: string;           // 시간대
  H_DNG_CD: string;     // 행정동 코드
  CELL_ID: string;      // 250m 격자 ID
  SPOP: number;         // 총 생활인구수
  
  // 백엔드에서 미리 합산해서 보내주는 10세 단위 데이터
  pop_0_10: number;
  pop_10_20: number;
  pop_20_30: number;
  pop_30_40: number;
  pop_40_50: number;
  pop_50_60: number;
  pop_60_plus: number;
  // 상세 데이터 (M00, F00, M10... 등) 접근을 위한 인덱스 시그니처
  [key: string]: string | number;
}

export interface PopulationResponse {
  list_total_count: number;
  RESULT: {
    CODE: string;
    MESSAGE: string;
  };
  row: PopulationRow[];
}

// UI에서 사용할 필터 타입
export type GenderFilter = 'Total' | 'Male' | 'Female';
export type AgeFilter = 'Total' | '0-10' | '10-20' | '20-30' | '30-40' | '40-50' | '50-60' | '60+';

// --- 격자 및 인구 결합 데이터 타입 ---

export interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface CombinedFeature {
  cell_id: string;
  geometry: GeoJsonGeometry;
  population: PopulationRow;
  center?: { lat: number; lng: number };
}

export interface CombinedLayerResponse {
  ymd: string;
  tt: string;
  features: CombinedFeature[];
}