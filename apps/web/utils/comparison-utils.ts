import { ComparisonMetric } from '../services/commercial-area/types';

/**
 * 숫자를 천 단위 콤마로 포맷팅합니다
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 금액을 억/만 단위로 포맷팅합니다
 */
export function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    const uk = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `${uk}억 ${man}만원` : `${uk}억원`;
  } else if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    return `${man}만원`;
  }
  return `${amount}원`;
}

/**
 * 비율을 퍼센트로 포맷팅합니다
 */
export function formatPercentage(percentage: number): string {
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}

/**
 * 비교 메트릭의 차이를 설명하는 텍스트를 생성합니다
 */
export function getComparisonText(metric: ComparisonMetric): string {
  if (metric.total === 0) {
    return '동일';
  }

  const direction = metric.total > 0 ? '높음' : '낮음';
  return `${formatNumber(Math.abs(metric.total))} (${formatPercentage(metric.percentage)}) ${direction}`;
}

/**
 * 비교 메트릭의 색상을 반환합니다 (긍정/부정)
 */
export function getComparisonColor(
  metric: ComparisonMetric,
): 'positive' | 'negative' | 'neutral' {
  if (metric.total === 0) return 'neutral';
  return metric.total > 0 ? 'positive' : 'negative';
}

/**
 * Tailwind CSS 클래스를 반환합니다
 */
export function getComparisonColorClass(metric: ComparisonMetric): string {
  const color = getComparisonColor(metric);
  switch (color) {
    case 'positive':
      return 'text-green-600';
    case 'negative':
      return 'text-red-600';
    case 'neutral':
      return 'text-gray-600';
  }
}
