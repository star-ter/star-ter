export interface TimeSlotPopulation {
  time_slot: string; // '0-8', '8-16', '16-24'
  avg_population: number;
  sum_population: number;
  
  // 성별/연령대별 데이터 (합계)
  male_total: number;
  female_total: number;
  age_10s_total: number;
  age_20s_total: number;
  age_30s_total: number;
  age_40s_total: number;
  age_50s_total: number;
  age_60s_plus_total: number;

  // Granular gender-age fields
  m00: number; m10: number; m15: number; m20: number; m25: number; m30: number; m35: number;
  m40: number; m45: number; m50: number; m55: number; m60: number; m65: number; m70: number;
  f00: number; f10: number; f15: number; f20: number; f25: number; f30: number; f35: number;
  f40: number; f45: number; f50: number; f55: number; f60: number; f65: number; f70: number;
}

export interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface CombinedFeature {
  cell_id: string;
  geometry: GeoJsonGeometry;
  time_slots: TimeSlotPopulation[];
  center?: { lat: number; lng: number };
}

export interface CombinedLayerResponse {
  features: CombinedFeature[];
}

// UI에서 사용할 필터 타입
export type GenderFilter = 'Total' | 'Male' | 'Female';
export type AgeFilter = 'Total' | '10대' | '20대' | '30대' | '40대' | '50대' | '60대+';
export type TimeFilter = '0-8' | '8-16' | '16-24' | 'All';