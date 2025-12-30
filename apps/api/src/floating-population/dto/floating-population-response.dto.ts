export class GeoJsonGeometry {
  type: string;
  coordinates: number[][][];
}

export class TimeSlotPopulation {
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
}

export class TimeSegmentedPopulationFeature {
  cell_id: string;
  geometry: GeoJsonGeometry;
  time_slots: TimeSlotPopulation[];
}

export class TimeSegmentedLayerResponse {
  features: TimeSegmentedPopulationFeature[];
}
