import { Injectable } from '@nestjs/common';

export interface SalesData {
  thsmon_selng_amt: bigint | number | null;
  agrde_10_selng_amt: bigint | number | null;
  agrde_20_selng_amt: bigint | number | null;
  agrde_30_selng_amt: bigint | number | null;
  agrde_40_selng_amt: bigint | number | null;
  agrde_50_selng_amt: bigint | number | null;
  agrde_60_above_selng_amt: bigint | number | null;
}

const AGE_COLUMN_MAP: Record<string, keyof SalesData> = {
  '10s': 'agrde_10_selng_amt',
  '20s': 'agrde_20_selng_amt',
  '30s': 'agrde_30_selng_amt',
  '40s': 'agrde_40_selng_amt',
  '50s': 'agrde_50_selng_amt',
  '60s': 'agrde_60_above_selng_amt',
};

const AGE_LABEL_MAP: Record<string, string> = {
  '10s': '10대',
  '20s': '20대',
  '30s': '30대',
  '40s': '40대',
  '50s': '50대',
  '60s': '60대 이상',
};

@Injectable()
export class AgeScoreCalculator {
  /**
   * 연령대 점수 계산 (0~1)
   *
   * 캡핑 기반 정규화:
   * - 33% 이상의 연령대 매출 비율 = 만점 (1.0)
   * - 그 이하는 선형 증가 (ratio / 0.33)
   *
   * 이유: 6개 연령대 균등 분포 시 각 16.7%.
   * 33%는 평균의 약 2배로, "타깃 연령대가 충분히 집중됨"을 의미.
   */
  private readonly MAX_RATIO = 0.33;

  calculate(salesData: SalesData, targetAge: string): number {
    const total = Number(salesData.thsmon_selng_amt || 0);
    if (total === 0) return 0;

    const ageColumn = AGE_COLUMN_MAP[targetAge];
    if (!ageColumn) return 0;

    const ageAmount = Number(salesData[ageColumn] || 0);
    const ratio = ageAmount / total;

    // 캡핑 기반 정규화: 33% 이상이면 만점
    return Math.min(ratio / this.MAX_RATIO, 1);
  }

  /**
   * 점수 + 설명 + 선택 연령대 비중 함께 반환
   */
  calculateWithExplanation(
    salesData: SalesData,
    targetAge: string,
  ): {
    score: number;
    explanation: string;
    breakdown: { selected: number; others: number };
  } {
    const total = Number(salesData.thsmon_selng_amt || 0);
    const ageLabel = AGE_LABEL_MAP[targetAge] || targetAge;

    // 기본값: 선택 연령대 0%, 나머지 100%
    const breakdown = { selected: 0, others: 100 };

    if (total === 0) {
      return {
        score: 0,
        explanation: `매출 데이터가 없습니다`,
        breakdown,
      };
    }

    const ageColumn = AGE_COLUMN_MAP[targetAge];
    if (!ageColumn) {
      return {
        score: 0,
        explanation: `연령대 정보를 확인할 수 없습니다`,
        breakdown,
      };
    }

    const ageAmount = Number(salesData[ageColumn] || 0);
    const selectedRatio = (ageAmount / total) * 100;
    breakdown.selected = selectedRatio;
    breakdown.others = 100 - selectedRatio;

    const score = Math.min(selectedRatio / 100 / this.MAX_RATIO, 1);

    return {
      score,
      explanation: `${ageLabel} 매출 비중 ${selectedRatio.toFixed(1)}%`,
      breakdown,
    };
  }
}
