// 개별 카테고리별 데이터
export interface CategoryData {
  category: string;
  count: number;
  sales?: number;
}

// 시간대별 데이터
export interface TimeSlotData {
  timeSlot: string;
  count: number;
}

// 연령대별 데이터
export interface AgeGroupData {
  ageGroup: string;
  count: number;
}

// 점포 정보
export interface StoreInfo {
  total: number;
  byCategory: CategoryData[];
}

// 매출 정보
export interface SalesInfo {
  total: number;
  byCategory: CategoryData[];
}

// 유동인구 정보
export interface FloatingPopulationInfo {
  total: number;
  byTimeSlot: TimeSlotData[];
  byAgeGroup: AgeGroupData[];
}

// 주거인구 정보
export interface ResidentialPopulationInfo {
  total: number;
  byAgeGroup: AgeGroupData[];
  households: number;
}

// 상권 상세 정보 (단일 상권)
export class AreaDetailDto {
  areaCode: string;
  areaName: string;
  polygon: unknown; // GeoJSON polygon - JsonValue 대신 unknown 사용
  x: number;
  y: number;
  stores: StoreInfo;
  sales: SalesInfo;
  floatingPopulation: FloatingPopulationInfo;
  residentialPopulation: ResidentialPopulationInfo;
}

// 비교 차이 정보
export interface ComparisonMetric {
  total: number;
  percentage: number;
}

export interface ComparisonDiffDto {
  stores: ComparisonMetric;
  sales: ComparisonMetric;
  floatingPopulation: ComparisonMetric;
  residentialPopulation: ComparisonMetric;
}

// 최종 비교 응답
export class AreaComparisonResponse {
  comparison: {
    area1: AreaDetailDto;
    area2: AreaDetailDto;
    diff: ComparisonDiffDto;
  };
}
