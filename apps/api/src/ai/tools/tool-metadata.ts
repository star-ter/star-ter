/**
 * Tool 메타데이터 정의
 *
 * [개념 설명]
 * 각 Tool이 어떤 데이터 소스를 사용하는지 정의합니다.
 * AI 응답 시 이 정보를 SourceCard로 표시하여 데이터 출처를 명확히 합니다.
 */

export interface ToolMetadata {
  displayName: string; // 사용자에게 표시되는 이름
  source: string; // 데이터 출처
  icon?: string; // 아이콘 (선택)
}

/**
 * 21개 Tool에 대한 메타데이터
 * key: Tool 이름 (definitions.ts의 name과 일치)
 */
export const TOOL_METADATA: Record<string, ToolMetadata> = {
  // === 기본 상권 정보 ===
  get_store: {
    displayName: '상권 기본정보',
    source: '서울시 상권분석 시스템',
  },
  get_resident_population: {
    displayName: '상주인구 분석',
    source: '서울시 빅데이터 캠퍼스',
  },
  get_working_population: {
    displayName: '직장인구 분석',
    source: '서울시 빅데이터 캠퍼스',
  },
  get_income_consumption: {
    displayName: '소득/소비 분석',
    source: '서울시 빅데이터 캠퍼스',
  },

  // === 업종/매출 분석 ===
  get_sales_top_industries: {
    displayName: '업종별 매출 순위',
    source: '서울시 상권분석 시스템',
  },
  get_store_top_industries: {
    displayName: '업종별 점포 순위',
    source: '서울시 상권분석 시스템',
  },
  get_industry_commercial_summary: {
    displayName: '업종별 상권 요약',
    source: '서울시 상권분석 시스템',
  },

  // === 상권 비교/추천 ===
  compare_commercial_areas: {
    displayName: '상권 비교',
    source: '서울시 상권분석 시스템',
  },
  compare_commercial_by_industry: {
    displayName: '업종별 상권 비교',
    source: '서울시 상권분석 시스템',
  },
  recommend_commercial_by_industry: {
    displayName: '맞춤 상권 추천',
    source: '서울시 상권분석 시스템',
  },
  find_similar_commercial_areas: {
    displayName: '유사 상권 분석',
    source: '서울시 빅데이터 캠퍼스',
  },

  // === 유동인구 ===
  get_foot_traffic_timeseries: {
    displayName: '유동인구 추이',
    source: 'KT 통신데이터',
  },
  get_foot_traffic_detail: {
    displayName: '시간별 유동인구',
    source: 'KT 통신데이터',
  },

  // === 경쟁/리스크 분석 ===
  get_competition_analysis: {
    displayName: '경쟁 분석',
    source: '소상공인진흥공단',
  },
  get_commercial_risk: {
    displayName: '상권 리스크',
    source: '서울시 상권분석 시스템',
  },

  // === 수익/손익 분석 ===
  estimate_revenue_and_cost: {
    displayName: '매출/수익 추정',
    source: '서울시 빅데이터 캠퍼스',
  },
  calc_break_even: {
    displayName: '손익분기점 계산',
    source: '서울시 상권분석 시스템',
  },
  calc_break_even_with_listing: {
    displayName: '매물 기반 손익분기',
    source: '서울시 상권분석 시스템',
  },
  predict_survival_rate: {
    displayName: '생존율 예측',
    source: '소상공인진흥공단 통계',
  },

  // === 부동산/기타 ===
  recommend_real_estate: {
    displayName: '매물 추천',
    source: '네이버 부동산',
  },
  get_funding_programs: {
    displayName: '정책자금 안내',
    source: '소상공인진흥공단',
  },
  request_report_generation: {
    displayName: '리포트 생성',
    source: '내부 시스템',
  },
};

/**
 * Tool 이름으로 메타데이터 조회
 * 정의되지 않은 Tool은 기본값 반환
 */
export function getToolMetadata(toolName: string): ToolMetadata {
  return (
    TOOL_METADATA[toolName] || {
      displayName: toolName,
      source: '데이터 분석',
    }
  );
}
