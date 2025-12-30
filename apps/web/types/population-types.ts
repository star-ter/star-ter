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
  M00: number; M10: number; M15: number; M20: number; M25: number; M30: number; M35: number;
  M40: number; M45: number; M50: number; M55: number; M60: number; M65: number; M70: number;
  F00: number; F10: number; F15: number; F20: number; F25: number; F30: number; F35: number;
  F40: number; F45: number; F50: number; F55: number; F60: number; F65: number; F70: number;
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