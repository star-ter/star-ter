// 1. 하위 데이터 구조 정의 (차트용)
export class SalesTrendItem {
  year: string;
  quarter: string;
  revenue: number;
}

export class TimeSlotDistribution {
  time0006: number;
  time0611: number;
  time1114: number;
  time1417: number;
  time1721: number;
  time2124: number;
  peakTimeSummaryComment: string;
}

export class DayOfWeekDistribution {
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  peakDaySummaryComment: string;
}

export class Demographics {
  male: number;
  female: number;
  age10: number;
  age20: number;
  age30: number;
  age40: number;
  age50: number;
  age60: number;
  primaryGroupSummaryComment: string;
}

export class TopIndustry {
  name: string;
  ratio: number;
}

export class IndustryBreakdownItem {
  code: string;
  name: string;
  revenue: number;
}

export class IndustryCategoryBreakdown {
  macroCode: string;
  macroName: string;
  totalRevenue: number;
  subIndustries: IndustryBreakdownItem[];
}

// 2. 생명력(개업/폐업) / 매출 상세 그룹
export class MarketVitality {
  openingRate: number;
  closureRate: number;
}

export class MarketSalesDetail {
  trend: SalesTrendItem[];
  timeSlot: TimeSlotDistribution;
  dayOfWeek: DayOfWeekDistribution;
  demographics: Demographics;
  topIndustries: TopIndustry[];
  industryBreakdown?: IndustryCategoryBreakdown[];
}

// 3. 메인 분석용 DTO
export class MarketAnalyticsDto {
  areaName: string;
  isCommercialArea: boolean;
  totalRevenue: number;

  sales: MarketSalesDetail;
  vitality: MarketVitality;

  openingRate: number;
  closureRate: number;
}
