/**
 * salesDataConverter.ts - 백엔드 DTO를 그래프 컴포넌트 props 형식으로 변환하는 유틸리티
 *
 * ## 핵심 개념 설명
 *
 * ### 1. 데이터 변환 (Data Transformation)
 * - 백엔드에서 받은 데이터 구조와 프론트엔드 컴포넌트가 기대하는 구조가 다를 수 있습니다.
 * - 이 파일은 그 사이를 연결해주는 "어댑터" 역할을 합니다.
 *
 * ### 2. 타입 안전성 (Type Safety)
 * - TypeScript의 타입을 명시적으로 지정하여 런타임 에러를 방지합니다.
 * - 입력 타입과 출력 타입을 명확히 정의합니다.
 *
 * ### 3. 순수 함수 (Pure Function)
 * - 같은 입력에 항상 같은 출력을 반환합니다.
 * - 외부 상태를 변경하지 않습니다.
 */

import {
  SalesTrendItem as BackendTrendItem,
  TimeSlotDistribution,
  DayOfWeekDistribution,
  Demographics,
} from '@/types/market-types';

import {
  SalesTrendItem,
  TimeOfDaySalesItem,
  DayOfWeekSalesItem,
  AgeSalesItem,
  GenderSalesItem,
} from '@/types/analysis-types';

/**
 * 1. 매출 추이 데이터 변환
 * 백엔드: { year: "2024", quarter: "Q1", revenue: 1000000 }
 * 프론트: { period: "2024Q1", quarter: "Q1", sales: 1000000 }
 */
export function convertTrendData(trend: BackendTrendItem[]): SalesTrendItem[] {
  if (!trend || trend.length === 0) return [];

  return trend.map((item) => ({
    period: `${item.year}${item.quarter}`, // 년도+분기 조합
    quarter: item.quarter,
    sales: item.revenue, // revenue -> sales 필드명 변환
  }));
}

/**
 * 2. 시간대별 매출 데이터 변환
 * 백엔드: { time0006: 100, time0611: 200, ... }
 * 프론트: [{ time: "00~06", sales: 100, percentage: 10 }, ...]
 */
export function convertTimeSlotData(
  timeSlot: TimeSlotDistribution,
): TimeOfDaySalesItem[] {
  if (!timeSlot) return [];

  // 시간대 매핑 - 객체를 배열로 변환
  const mapping = [
    { time: '00~06', sales: timeSlot.time0006 || 0 },
    { time: '06~11', sales: timeSlot.time0611 || 0 },
    { time: '11~14', sales: timeSlot.time1114 || 0 },
    { time: '14~17', sales: timeSlot.time1417 || 0 },
    { time: '17~21', sales: timeSlot.time1721 || 0 },
    { time: '21~24', sales: timeSlot.time2124 || 0 },
  ];

  // 총합 계산 (백분율 계산용)
  const total = mapping.reduce((sum, item) => sum + item.sales, 0) || 1;

  // 백분율 추가
  return mapping.map((item) => ({
    ...item,
    percentage: (item.sales / total) * 100,
  }));
}

/**
 * 3. 요일별 매출 데이터 변환
 * 백엔드: { mon: 100, tue: 200, ... }
 * 프론트: [{ day: "mon", sales: 100, percentage: 10 }, ...]
 */
export function convertDayOfWeekData(
  dayOfWeek: DayOfWeekDistribution,
): DayOfWeekSalesItem[] {
  if (!dayOfWeek) return [];

  // 요일 순서대로 배열 변환
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  const mapping = days.map((day) => ({
    day,
    sales: dayOfWeek[day] || 0,
  }));

  // 총합 계산
  const total = mapping.reduce((sum, item) => sum + item.sales, 0) || 1;

  // 백분율 추가
  return mapping.map((item) => ({
    ...item,
    percentage: (item.sales / total) * 100,
  }));
}

/**
 * 4. 성별 데이터 변환
 * 백엔드 Demographics: { male: 100, female: 200, age10: 50, ... }
 * 프론트 GenderSalesItem: { male: 100, female: 200 }
 */
export function convertGenderData(demographics: Demographics): GenderSalesItem {
  if (!demographics) return { male: 0, female: 0 };

  return {
    male: demographics.male || 0,
    female: demographics.female || 0,
  };
}

/**
 * 5. 연령대 데이터 변환
 * 백엔드 Demographics: { male: 100, female: 200, age10: 50, age20: 100, ... }
 * 프론트 AgeSalesItem: { '10s': 50, '20s': 100, ... }
 */
export function convertAgeData(demographics: Demographics): AgeSalesItem {
  if (!demographics) return {};

  // 연령대 키 매핑
  return {
    '10s': demographics.age10 || 0,
    '20s': demographics.age20 || 0,
    '30s': demographics.age30 || 0,
    '40s': demographics.age40 || 0,
    '50s': demographics.age50 || 0,
    '60s': demographics.age60 || 0,
  };
}
