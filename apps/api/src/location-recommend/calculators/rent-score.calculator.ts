import { Injectable } from '@nestjs/common';

const CAPITAL_MAP: Record<string, number> = {
  '10M': 10000000,
  '30M': 30000000,
  '50M': 50000000,
  '100M': 100000000,
  '200M': 200000000,
  '200M+': 300000000,
};

const CAPITAL_LABEL_MAP: Record<string, string> = {
  '10M': '1천만원',
  '30M': '3천만원',
  '50M': '5천만원',
  '100M': '1억원',
  '200M': '2억원',
  '200M+': '2억원 이상',
};

@Injectable()
export class RentScoreCalculator {
  /**
   * 임대료 점수 계산 (0.1 ~ 1.0)
   *
   * 정책:
   * - 상권 평균 비용이 사용자 창업 자본금 이내면 1점
   * - 초과하면 (자본금 / 비용) 비율로 감점
   *
   * @param capital 자본금 문자열 ('10M', '30M', ...)
   * @param avgDeposit 평균 보증금 (천원 단위)
   * @param avgRent 평균 월세 (천원 단위)
   */
  calculate(
    capital: string,
    avgDeposit: number | null,
    avgRent: number | null,
  ): number {
    const capitalAmount = CAPITAL_MAP[capital] || 50000000;

    // 평균 보증금, 평균 월세가 없으면 매물이 없는거임 - 0점 부여
    if (avgDeposit === null && avgRent === null) {
      return 0;
    }

    // 천원 → 원 단위 변환
    // 1년 비용 기준: 보증금 + (월세 × 12개월)
    const deposit = (avgDeposit || 0) * 1000;
    const rent = (avgRent || 0) * 12 * 1000;
    const totalCost = deposit + rent;

    // 데이터 이상 방어
    if (totalCost <= 0) {
      return 0;
    }

    // 예산 이내 → 만점
    if (totalCost <= capitalAmount) {
      return 1.0;
    }

    // 예산 초과 → 비율 감점
    const ratio = capitalAmount / totalCost;

    // 최소 0.1 보장
    return Math.max(0.1, Math.min(1, ratio));
  }

  /**
   * 점수 + 설명 함께 반환
   */
  calculateWithExplanation(
    capital: string,
    avgDeposit: number | null,
    avgRent: number | null,
  ): { score: number; explanation: string } {
    const capitalLabel = CAPITAL_LABEL_MAP[capital] || capital;
    const capitalAmount = CAPITAL_MAP[capital] || 50000000;

    if (avgDeposit === null && avgRent === null) {
      return {
        score: 0,
        explanation: `임대 매물 데이터가 없습니다`,
      };
    }

    const deposit = (avgDeposit || 0) * 1000;
    const rent = (avgRent || 0) * 1000;
    const monthlyRent = rent;
    const totalCost = deposit + rent * 12;

    if (totalCost <= 0) {
      return {
        score: 0,
        explanation: `비용 정보를 확인할 수 없습니다`,
      };
    }

    const score =
      totalCost <= capitalAmount
        ? 1.0
        : Math.max(0.1, Math.min(1, capitalAmount / totalCost));

    const formatMoney = (amount: number) => {
      if (amount >= 100000000) {
        return `${(amount / 100000000).toFixed(1)}억원`;
      }
      return `${Math.floor(amount / 10000).toLocaleString()}만원`;
    };

    const depositStr = formatMoney(deposit);
    const rentStr = formatMoney(monthlyRent);

    if (score >= 1) {
      return {
        score,
        explanation: `보증금 ${depositStr}, 월세 ${rentStr} (예산 ${capitalLabel} 이내)`,
      };
    }

    return {
      score,
      explanation: `보증금 ${depositStr}, 월세 ${rentStr} (예산 ${capitalLabel} 초과)`,
    };
  }
}
