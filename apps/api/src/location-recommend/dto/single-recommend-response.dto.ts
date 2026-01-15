export class ScoreWithExplanation {
  score: number;
  explanation: string;
}

// 연령별 매출 비중 (선택 연령대 vs 나머지)
export class AgeBreakdown {
  selected: number;
  others: number;
}

export class AgeScoreData extends ScoreWithExplanation {
  breakdown: AgeBreakdown;
}

// 상권 테마 세부 데이터
export class RegionDetails {
  theme: string; // office, residential 등 (코드)
  themeLabel: string; // 오피스, 주거지역 등 (라벨)
  mainAgeGroup: string; // 주요 연령층
  mainAgeRatio: number; // 주요 연령층 비중
  nearbyUniversities: number; // 인근 대학 수
  nearbySubways: number; // 인근 지하철역 수
  footTraffic: number; // 유동인구
}

export class RegionScoreData extends ScoreWithExplanation {
  details: RegionDetails;
}

// 시간대별 매출 비중
export class TimeBreakdown {
  morning: number; // 06~12
  afternoon: number; // 12~18
  evening: number; // 18~24
  night: number; // 00~06
}

export class TimeScoreData extends ScoreWithExplanation {
  breakdown: TimeBreakdown;
  selectedTime: string;
}

export class StartupCost {
  total: number;
  deposit: number;
  monthlyRent: number;
}

export class BusinessMetrics {
  totalRevenue: number;
  industryRevenue: number;
  competitorCount: number;
  startupCost: StartupCost;
  appliedIndustryName: string;
}

export class SingleRecommendResponseDto {
  trdarCd: string;
  name: string;
  totalScore: number;
  scores: {
    age: AgeScoreData;
    region: RegionScoreData;
    time: TimeScoreData;
    rent: ScoreWithExplanation;
    industry: ScoreWithExplanation | null;
  };
  userPreferences: {
    age: string;
    region: string;
    operatingTime: string;
    capital: string;
    industryCode: string | null;
  };
  businessMetrics: BusinessMetrics;
}
