import { IsString, IsNotEmpty } from 'class-validator';

export class GetSummaryReportQueryDto {
  @IsString()
  @IsNotEmpty()
  industryCode: string;

  @IsString()
  @IsNotEmpty()
  regionCode: string;
}

export interface SummaryReportResponse {
  areaName: string;
  industryName: string;
  generatedDate: string;
  // 1) 핵심 지표
  keyIndicators: {
    monthlyRevenue: {
      conservative: number;
      optimal: number;
    };
    estimatedFootTraffic: number;
    peakDay: string;
    peakAgeGroup: string;
    competitionIntensity: 'Low' | 'Medium' | 'High';
  };

  // 2) 상권 개요
  marketOverview: {
    characteristics: string;
    visitMotivation: string;
    peakTime: string;
    inflowPath: string;
  };

  // 3) 고객 구성(성별)
  genderDistribution: {
    male: number;
    female: number;
    interpretation: string;
  };

  // 4) 연령대 분포
  ageDistribution: {
    age10: number;
    age20: number;
    age30: number;
    age40: number;
    age50plus: number;
  };

  // 6) 시간대별 유동(요약)
  timeBasedFootTraffic: {
    time11_14: number;
    time14_17: number;
    time17_21: number;
    time21_24: number;
    interpretation: string;
  };

  // 7) 요일별 특성(요약)
  dayOfWeekCharacteristics: {
    weekday: string; // 월~목
    friday: string;
    saturday: string;
    sunday: string;
  };

  // 8) 경쟁/상권 구조(요약)
  competitionStructure: {
    density: {
      summary: string;
      insight: string;
    };
    priceCompetition: {
      summary: string;
      insight: string;
    };
    inflowPath: {
      summary: string;
      insight: string;
    };
    linkedIndustries: {
      summary: string;
      insight: string;
    };
  };
}
