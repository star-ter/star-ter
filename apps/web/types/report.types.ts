export interface ReportMetric {
  label: string;
  value: string;
  subValue?: string;
  description?: string;
}

export interface KeyMetricsData {
  estimatedMonthlySales: {
    max: number;
  };
  wellDoingMonthlySales: {
    max: number;
  };
  floatingPopulation: {
    count: number;
    mainTime: string; // e.g. "18:00~22:00"
  };
  mainVisitDays: {
    days: string[]; // e.g. ["금", "토"]
    comment: string;
  };
  coreCustomer: {
    ageGroup: string; // e.g. "20~34세"
    comment: string;
  };
  competitionIntensity: {
    level: '높음' | '보통' | '낮음';
    comment: string;
  };
}

export interface ZoneOverviewData {
  characteristics: string;
  visitMotivation: string;
  peakTime: string;
  inflowPath: string;
}

export interface CustomerCompositionData {
  malePercentage: number;
  femalePercentage: number;
}

export interface AgeDistributionData {
  age10: number;
  age20: number;
  age30: number;
  age40: number;
  age50Plus: number;
}

export interface SummaryInsight {
  category: '패턴' | '고객' | '상권';
  content: string;
  highlight?: string; // Bold part of the text
}

export interface HourlyFlowData {
  timeRange: string;
  level: '보통' | '낮음' | '상승' | '피크' | '높음';
  intensity: number; // 0-100 for bar width
}

export interface WeeklyCharacteristicsData {
  day: string;
  characteristics: string;
}

export interface CompetitionTableItem {
  category: string;
  summary: string;
  implication: string;
}

export interface ConclusionItem {
  category: '운영' | '상품' | '마케팅';
  content: string;
  highlight?: string;
}

export interface ReportData {
  meta: {
    generatedAt: string;
    category: string; // 업종
    subCategory?: string;
    region: string; // 지역
    radius: number; // 반경
    period: string; // 기간
  };
  keyMetrics: KeyMetricsData;
  zoneOverview: ZoneOverviewData;
  customerComposition: CustomerCompositionData;
  ageDistribution: AgeDistributionData;
  summaryInsights: SummaryInsight[];
  hourlyFlow: {
    summary: string;
    data: HourlyFlowData[];
  };
  weeklyCharacteristics: WeeklyCharacteristicsData[];
  competitionAnalysis: CompetitionTableItem[];
  conclusion: ConclusionItem[];
}
