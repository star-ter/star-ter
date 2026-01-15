export interface ScoreWithExplanation {
  score: number;
  explanation: string;
}

// 연령별 매출 비중 (선택 연령대 vs 나머지)
export interface AgeBreakdown {
  selected: number;
  others: number;
}

export interface AgeScoreData extends ScoreWithExplanation {
  breakdown: AgeBreakdown;
}

// 상권 테마 세부 데이터
export interface RegionDetails {
  theme: string;
  themeLabel: string;
  mainAgeGroup: string;
  mainAgeRatio: number;
  nearbyUniversities: number;
  nearbySubways: number;
  footTraffic: number;
}

export interface RegionScoreData extends ScoreWithExplanation {
  details: RegionDetails;
}

// 시간대별 매출 비중
export interface TimeBreakdown {
  morning: number; // 06~12
  afternoon: number; // 12~18
  evening: number; // 18~24
  night: number; // 00~06
}

export interface TimeScoreData extends ScoreWithExplanation {
  breakdown: TimeBreakdown;
  selectedTime: string;
}

export interface BusinessMetrics {
  totalRevenue: number;
  industryRevenue: number;
  competitorCount: number;
  startupCost: {
    total: number;
    deposit: number;
    monthlyRent: number;
  };
  appliedIndustryName: string;
}

export interface ScoreData {
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
  businessMetrics?: BusinessMetrics;
}

export interface RevenueData {
  estimatedRevenue: number;
  startupCost: {
    total: number;
    deposit: number;
    premium: number;
    monthlyRent?: number;
  };
  competitorCount: number;
  appliedIndustry: string;
  appliedIndustryName: string;
  matchingScore: number;
}
