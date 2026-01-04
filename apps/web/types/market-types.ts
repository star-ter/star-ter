export interface MarketStore {
  name: string;
  category: string;
  subcategory?: string;
}

// Sub-types matching backend DTO
export interface SalesTrendItem {
  year: string;
  quarter: string;
  revenue: number;
}

export interface TimeSlotDistribution {
  time0006: number;
  time0611: number;
  time1114: number;
  time1417: number;
  time1721: number;
  time2124: number;
  peakTimeSummaryComment: string;
}

export interface DayOfWeekDistribution {
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  peakDaySummaryComment: string;
}

export interface Demographics {
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

export interface TopIndustry {
  name: string;
  ratio: number;
}

export interface IndustryBreakdownItem {
  code: string;
  name: string;
  revenue: number;
}

export interface IndustryCategoryBreakdown {
  macroCode: string;
  macroName: string;
  totalRevenue: number;
  subIndustries: IndustryBreakdownItem[];
}

export interface MarketSalesDetail {
  trend: SalesTrendItem[];
  timeSlot: TimeSlotDistribution;
  dayOfWeek: DayOfWeekDistribution;
  demographics: Demographics;
  topIndustries: TopIndustry[];
  industryBreakdown?: IndustryCategoryBreakdown[];
}

export interface MarketAnalysisData {
  isCommercialZone: boolean;
  areaName: string;
  estimatedRevenue: number;
  salesDescription: string;

  reviewSummary: {
    naver: string;
  };
  stores: MarketStore[];
  openingRate: number;
  closureRate: number;
  sales: MarketSalesDetail; // Strict type applied
}
