
import { ReportData } from '@/types/report.types';

export const MOCK_REPORT_DATA: ReportData = {
  meta: {
    generatedAt: '2025-12-23',
    category: '삼겹살/구이',
    subCategory: '구이/주점',
    region: '서울 관악구 봉천동',
    radius: 500,
    period: '최근 4주(예시)',
  },
  keyMetrics: {
    estimatedMonthlySales: { max: 90000000 },
    wellDoingMonthlySales: { max: 160000000 },
    floatingPopulation: { count: 148000, mainTime: '18:00~22:00' },
    mainVisitDays: { days: ['금', '토'], comment: '주말 저녁 수요 강세' },
    coreCustomer: { ageGroup: '20~34세', comment: '데이트/모임 비중 높음' },
    competitionIntensity: { level: '높음', comment: '구이/주점 밀집' },
  },
  zoneOverview: {
    characteristics: '연남동 메인 상권(도보 중심)',
    visitMotivation: '식사 + 2차(카페/주점) 연계',
    peakTime: '평일 19~21시 / 주말 18~22시',
    inflowPath: '지하철+도보',
  },
  customerComposition: {
    malePercentage: 48,
    femalePercentage: 52,
  },
  ageDistribution: {
    age10: 7,
    age20: 34,
    age30: 28,
    age40: 18,
    age50Plus: 13,
  },
  summaryInsights: [
    {
      category: '패턴',
      content: '저녁 시간대(특히 19~21시)에 유동이 집중되어 회전율/대기 관리가 중요합니다.',
      highlight: '회전율/대기 관리',
    },
    {
      category: '고객',
      content: '20~34세 비중이 높아 세트 메뉴·가성비 구성과 사진/리뷰 유도가 유효합니다.',
      highlight: '세트 메뉴·가성비 구성',
    },
    {
      category: '상권',
      content: '경쟁 점포가 밀집되어 대표 메뉴(시그니처) 명확화와 피크 시간 전후 프로모션이 필요합니다.',
      highlight: '대표 메뉴(시그니처) 명확화',
    },
  ],
  hourlyFlow: {
    summary: '점심은 완만, 저녁은 급증 → 구이 업종 특성 반영',
    data: [
      { timeRange: '11~14시', intensity: 40, level: '보통' },
      { timeRange: '14~17시', intensity: 20, level: '낮음' },
      { timeRange: '17~19시', intensity: 60, level: '상승' },
      { timeRange: '19~21시', intensity: 90, level: '피크' },
      { timeRange: '21~24시', intensity: 70, level: '높음' },
    ],
  },
  weeklyCharacteristics: [
    { day: '월~목', characteristics: '퇴근 후 회식/소모임 중심 · 19~21시 집중' },
    { day: '금', characteristics: '주간 최고치 · 대기/회전 관리 필요' },
    { day: '토', characteristics: '데이트/친구 모임 · 18~22시 폭넓게 높음' },
    { day: '일', characteristics: '저녁 전(17~19시) 수요 존재 · 2차는 상대적 감소' },
  ],
  competitionAnalysis: [
    { category: '동종 업종 밀집', summary: '구이/주점/이자카야 다수(더미)', implication: '시그니처/리뷰 포인트' },
    { category: '가격대 경쟁', summary: '중가~중상가 혼재', implication: '세트 구성 + 추가 메뉴 업셀' },
    { category: '유입 동선', summary: '도보 이동 많고 골목 상권 특성', implication: '간판/입구 가시성, 웨이팅 안내' },
    { category: '연계 업종', summary: '카페/디저트/주점과 연계', implication: '2차 제휴/리뷰 쿠폰 등' },
  ],
  conclusion: [
    { category: '운영', content: '피크 시간대 인력/좌석 회전 설계를 먼저 잡고, 웨이팅 안내를 표준화합니다.', highlight: '웨이팅 안내' },
    { category: '상품', content: "'대표 메뉴 1개 + 베스트 사이드 1개'로 기억 포인트를 만들고 세트로 노출합니다.", highlight: '대표 메뉴 1개 + 베스트 사이드 1개' },
    { category: '마케팅', content: '20~34세 타겟에 맞춰 사진/리뷰 유도 장치를 넣고, 금·토 집중 프로모션을 테스트합니다.', highlight: '금·토 집중 프로모션' },
  ],
};
