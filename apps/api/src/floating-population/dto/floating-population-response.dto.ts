export type AgeGroup =
  | '00'
  | '10'
  | '15'
  | '20'
  | '25'
  | '30'
  | '35'
  | '40'
  | '45'
  | '50'
  | '55'
  | '60'
  | '65'
  | '70';

// for문 돌듯이 M00 부터 M70 까지의 타입을 생성
export type MaleFields = {
  [K in AgeGroup as `M${K}`]: number;
};

// for문 돌듯이 F00 부터 F70 까지의 타입을 생성
export type FemaleFields = {
  [K in AgeGroup as `F${K}`]: number;
};

// MaleFields와 FemaleFields를 합쳐서 FloatingPopulationRow 타입을 생성
export interface FloatingPopulationRow extends MaleFields, FemaleFields {
  YMD: string; // 일자
  TT: string; // 시간
  H_DNG_CD: string; // 행정동코드
  CELL_ID: string; // 250M격자
  SPOP: number; // 생활인구 합계
  // 10단위로 나이 정제
  pop_0_10: number;
  pop_10_20: number;
  pop_20_30: number;
  pop_30_40: number;
  pop_40_50: number;
  pop_50_60: number;
  pop_60_plus: number;
}

export interface SeoulApiResult {
  CODE: string;
  MESSAGE: string;
}

/**
 * 전체 API 응답 구조
 */
export interface FloatingPopulationResponse {
  list_total_count: number; // 총 데이터 건수
  RESULT: SeoulApiResult;
  row: FloatingPopulationRow[]; // 실제 데이터 목록
}

export type RawSeoulApiResponse = {
  [serviceName: string]: FloatingPopulationResponse;
} & {
  RESULT: SeoulApiResult;
};

/**
 * 서울시 XML API 응답을 위한 타입 (fast-xml-parser 결과물용)
 */
export interface SeoulXmlRow extends Omit<
  FloatingPopulationRow,
  | 'SPOP'
  | 'pop_0_10'
  | 'pop_10_20'
  | 'pop_20_30'
  | 'pop_30_40'
  | 'pop_40_50'
  | 'pop_50_60'
  | 'pop_60_plus'
> {
  SPOP: string | number;
  [key: string]: string | number; // M00, F00 등 동적 필드 대응
}

export interface SeoulXmlResponse {
  list_total_count: string | number;
  RESULT: SeoulApiResult;
  row: SeoulXmlRow | SeoulXmlRow[];
}

export type RawSeoulXmlResponse = {
  [serviceName: string]: SeoulXmlResponse | SeoulApiResult | undefined;
} & {
  RESULT?: SeoulApiResult;
};

// --- New DTOs for Grid Integration ---

export interface GeoJsonGeometry {
  type: string;
  coordinates: any[]; // GeoJSON coordinates can be complex nested arrays
}

export interface CombinedPopulationFeature {
  cell_id: string;
  geometry: GeoJsonGeometry;
  population: FloatingPopulationRow;
}

export interface CombinedLayerResponse {
  ymd: string;
  tt: string;
  features: CombinedPopulationFeature[];
}
