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

export type MaleFields = {
  [K in AgeGroup as `M${K}`]: number;
};

export type FemaleFields = {
  [K in AgeGroup as `F${K}`]: number;
};

export interface FloatingPopulationRow extends MaleFields, FemaleFields {
  ymd: string;
  tt: string;
  h_dng_cd: string;
  cell_id: string;
  spop: number;
  pop_0_10: number;
  pop_10_20: number;
  pop_20_30: number;
  pop_30_40: number;
  pop_40_50: number;
  pop_50_60: number;
  pop_60_plus: number;
  [key: string]: string | number;
}

export interface SeoulApiResult {
  CODE: string;
  MESSAGE: string;
}

export interface FloatingPopulationResponse {
  list_total_count: number;
  RESULT: SeoulApiResult;
  row: FloatingPopulationRow[];
}

export type RawSeoulApiResponse = {
  [serviceName: string]: FloatingPopulationResponse;
} & {
  RESULT: SeoulApiResult;
};

export interface SeoulXmlRow extends Omit<
  FloatingPopulationRow,
  | 'spop'
  | 'pop_0_10'
  | 'pop_10_20'
  | 'pop_20_30'
  | 'pop_30_40'
  | 'pop_40_50'
  | 'pop_50_60'
  | 'pop_60_plus'
> {
  spop: string | number;
  [key: string]: string | number;
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

export class GeoJsonGeometry {
  type: string;
  coordinates: any[];
}

export class CombinedPopulationFeature {
  cell_id: string;
  geometry: GeoJsonGeometry;
  population: FloatingPopulationRow;
}

export class CombinedLayerResponse {
  ymd: string;
  tt: string;
  features: CombinedPopulationFeature[];
}

// --- Time Segmented DTOs (used by frontend population layer) ---

export class TimeSlotPopulation {
  time_slot: string; // '0-8', '8-16', '16-24'
  avg_population: number;
  sum_population: number;

  male_total: number;
  female_total: number;
  age_10s_total: number;
  age_20s_total: number;
  age_30s_total: number;
  age_40s_total: number;
  age_50s_total: number;
  age_60s_plus_total: number;

  // Granular gender-age fields
  m00: number;
  m10: number;
  m15: number;
  m20: number;
  m25: number;
  m30: number;
  m35: number;
  m40: number;
  m45: number;
  m50: number;
  m55: number;
  m60: number;
  m65: number;
  m70: number;
  f00: number;
  f10: number;
  f15: number;
  f20: number;
  f25: number;
  f30: number;
  f35: number;
  f40: number;
  f45: number;
  f50: number;
  f55: number;
  f60: number;
  f65: number;
  f70: number;
}

export class TimeSegmentedPopulationFeature {
  cell_id: string;
  geometry: GeoJsonGeometry;
  time_slots: TimeSlotPopulation[];
}

export class TimeSegmentedLayerResponse {
  features: TimeSegmentedPopulationFeature[];
}
