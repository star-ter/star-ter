export interface BusinessCostStructure {
  categoryName: string;
  cogsRate: number; // 매출원가율 (재료비 등) - 변동비 성격
  laborCost: number; // 월 평균 인건비 (고정비 성격)
  otherFixedCost: number; // 기타 고정비 (통신비, 기장료, 보험료 등)
  variableRate: number; // 기타 변동비율 (카드수수료, 배달앱 수수료 등 포함)
}

// 업종별 평균 비용 구조 (추정치)
// 참고: 프랜차이즈 통계 및 일반적인 창업 가이드 기준
export const BUSINESS_COSTS: Record<string, BusinessCostStructure> = {
  // CS100010: 커피-음료
  CS100010: {
    categoryName: '카페',
    cogsRate: 0.35, // 원두, 우유, 패키지 등 (35%)
    laborCost: 3000000, // 매니저 1인 or 알바 2~3인 (월 300)
    otherFixedCost: 500000, // 기타 고정비
    variableRate: 0.05, // 카드수수료 등 (5%) -> 총 변동비율 40%
  },
  // CS100007: 치킨전문점
  CS100007: {
    categoryName: '치킨',
    cogsRate: 0.45, // 생닭, 파우더, 기름 등 (45%)
    laborCost: 4000000, // 주방/홀 인력 (월 400)
    otherFixedCost: 800000,
    variableRate: 0.1, // 배달 대행비, 수수료 비중 높음 (10%) -> 총 변동비율 55%
  },
  // CS100001: 한식음식점
  CS100001: {
    categoryName: '한식',
    cogsRate: 0.38, // 식자재 (38%)
    laborCost: 5000000, // 주방장, 찬모, 홀 (월 500)
    otherFixedCost: 1000000,
    variableRate: 0.05, // 총 변동비율 43%
  },
  // CS100004: 양식음식점
  CS100004: {
    categoryName: '양식',
    cogsRate: 0.35,
    laborCost: 4500000,
    otherFixedCost: 1000000,
    variableRate: 0.05,
  },
  // CS100002: 중식음식점
  CS100002: {
    categoryName: '중식',
    cogsRate: 0.35,
    laborCost: 4500000,
    otherFixedCost: 800000,
    variableRate: 0.05,
  },
  // CS100003: 일식음식점
  CS100003: {
    categoryName: '일식',
    cogsRate: 0.4, // 신선 식자재 비중 높음
    laborCost: 4500000,
    otherFixedCost: 800000,
    variableRate: 0.05,
  },
  // CS100008: 분식전문점
  CS100008: {
    categoryName: '분식',
    cogsRate: 0.35,
    laborCost: 2500000,
    otherFixedCost: 500000,
    variableRate: 0.05,
  },
  // CS100009: 호프-간이주점
  CS100009: {
    categoryName: '호프/주점',
    cogsRate: 0.3, // 주류 비중이 높아 원가율 낮음
    laborCost: 3500000, // 야간 인력
    otherFixedCost: 1000000,
    variableRate: 0.05,
  },
  // 기본값 (매칭되는 업종 없을 때)
  default: {
    categoryName: '기타',
    cogsRate: 0.4,
    laborCost: 3000000,
    otherFixedCost: 500000,
    variableRate: 0.05,
  },
};
