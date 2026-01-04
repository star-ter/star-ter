import { IsString, IsNotEmpty } from 'class-validator';

export class GetSummaryReportQueryDto {
  @IsString()
  @IsNotEmpty()
  industryCode: string;

  @IsString()
  @IsNotEmpty()
  regionCode: string;

  @IsString()
  @IsNotEmpty()
  industryName?: string;

  @IsString()
  @IsNotEmpty()
  regionName?: string;
}

export interface SummaryReportResponse {
  meta: {
    generatedAt: string;
    category: string;
    subCategory?: string;
    region: string;
    radius: number;
    period: string;
  };

  // 1) 핵심 지표
  keyMetrics: {
    estimatedMonthlySales: {
      max: number;
    };
    wellDoingMonthlySales: {
      max: number;
    };
    floatingPopulation: {
      count: number;
      mainTime: string;
    };
    mainVisitDays: {
      days: string[];
      comment: string;
    };
    coreCustomer: {
      ageGroup: string;
      comment: string;
    };
    competitionIntensity: {
      level: '높음' | '보통' | '낮음' | '데이터 부족';
      comment: string;
    };
  };

  // 2) 상권 개요
  zoneOverview: {
    characteristics: string;
    visitMotivation: string;
    peakTime: string;
    inflowPath: string;
  };

  // 3) 고객 구성(성별)
  customerComposition: {
    malePercentage: number;
    femalePercentage: number;
  };

  // 4) 연령대 분포
  ageDistribution: {
    age10: number;
    age20: number;
    age30: number;
    age40: number;
    age50Plus: number;
  };

  // 5) 인사이트 (프론트엔드 요구사항 추가)
  summaryInsights: {
    category: '패턴' | '고객' | '상권' | '데이터 부족';
    content: string;
    highlight?: string;
  }[];

  // 6) 시간대별 유동
  hourlyFlow: {
    summary: string;
    data: {
      timeRange: string;
      level: '보통' | '낮음' | '상승' | '피크' | '높음' | '데이터 부족';
      intensity: number;
    }[];
  };

  // 7) 요일별 특성
  weeklyCharacteristics: {
    day: string;
    characteristics: string;
  }[];

  // 8) 경쟁/상권 구조
  competitionAnalysis: {
    category: string;
    summary: string;
    implication: string;
  }[];

  // 9) 결론 (프론트엔드 요구사항 추가)
  conclusion: {
    category: '운영' | '상품' | '마케팅' | '데이터 부족';
    content: string;
    highlight?: string;
  }[];
}
