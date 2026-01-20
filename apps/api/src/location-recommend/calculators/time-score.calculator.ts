import { Injectable } from '@nestjs/common';

// 시간대별 매출 데이터 인터페이스 (로컬)
export interface TimeSalesData {
  thsmon_selng_amt: bigint | number | null;
  tmzon_00_06_selng_amt: bigint | number | null;
  tmzon_06_11_selng_amt: bigint | number | null;
  tmzon_11_14_selng_amt: bigint | number | null;
  tmzon_14_17_selng_amt: bigint | number | null;
  tmzon_17_21_selng_amt: bigint | number | null;
  tmzon_21_24_selng_amt: bigint | number | null;
}

type TimeColumn = keyof TimeSalesData;

const TIME_COLUMN_MAP: Record<string, TimeColumn[]> = {
  morning: ['tmzon_06_11_selng_amt'],
  afternoon: ['tmzon_11_14_selng_amt', 'tmzon_14_17_selng_amt'],
  evening: ['tmzon_17_21_selng_amt', 'tmzon_21_24_selng_amt'],
  night: ['tmzon_00_06_selng_amt'],
  allday: [], // 전체 시간대 → ratio = 1
};

const TIME_LABEL_MAP: Record<string, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
  night: '야간',
  allday: '종일',
};

@Injectable()
export class TimeScoreCalculator {
  /**
   * 시간대 점수 계산 (0~1)
   *
   * 캡핑 기반 정규화:
   * - 50% 이상의 시간대 매출 비율 = 만점 (1.0)
   * - 그 이하는 선형 증가 (ratio / 0.50)
   *
   * 이유: 대부분의 시간대에서 50%면 충분히 집중된 상권을 의미.
   */
  private readonly MAX_RATIO = 0.5;

  calculate(salesData: TimeSalesData, targetTime: string): number {
    if (targetTime === 'allday') return 1; // 전체 시간대는 항상 1점

    const total = Number(salesData.thsmon_selng_amt || 0);
    if (total === 0) return 0;

    const timeColumns = TIME_COLUMN_MAP[targetTime] || [];
    const timeAmount = timeColumns.reduce((sum, col) => {
      return sum + Number(salesData[col] || 0);
    }, 0);

    const ratio = timeAmount / total;

    // 캡핑 기반 정규화: 50% 이상이면 만점
    return Math.min(ratio / this.MAX_RATIO, 1);
  }

  /**
   * 점수 + 설명 + 시간대별 비중 함께 반환
   */
  calculateWithExplanation(
    salesData: TimeSalesData,
    targetTime: string,
  ): {
    score: number;
    explanation: string;
    breakdown: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
    selectedTime: string;
  } {
    const timeLabel = TIME_LABEL_MAP[targetTime] || targetTime;
    const total = Number(salesData.thsmon_selng_amt || 0);

    // 4개 시간대별 비중 계산
    const breakdown = {
      morning: 0, // 06~12
      afternoon: 0, // 12~18
      evening: 0, // 18~24
      night: 0, // 00~06
    };

    if (total > 0) {
      // morning: 06~11
      breakdown.morning =
        (Number(salesData.tmzon_06_11_selng_amt || 0) / total) * 100;
      // afternoon: 11~14 + 14~17
      breakdown.afternoon =
        ((Number(salesData.tmzon_11_14_selng_amt || 0) +
          Number(salesData.tmzon_14_17_selng_amt || 0)) /
          total) *
        100;
      // evening: 17~21 + 21~24
      breakdown.evening =
        ((Number(salesData.tmzon_17_21_selng_amt || 0) +
          Number(salesData.tmzon_21_24_selng_amt || 0)) /
          total) *
        100;
      // night: 00~06
      breakdown.night =
        (Number(salesData.tmzon_00_06_selng_amt || 0) / total) * 100;
    }

    if (targetTime === 'allday') {
      return {
        score: 1,
        explanation: `${timeLabel} 운영에 적합`,
        breakdown,
        selectedTime: targetTime,
      };
    }

    if (total === 0) {
      return {
        score: 0,
        explanation: `매출 데이터가 없습니다`,
        breakdown,
        selectedTime: targetTime,
      };
    }

    const timeColumns = TIME_COLUMN_MAP[targetTime] || [];
    const timeAmount = timeColumns.reduce((sum, col) => {
      return sum + Number(salesData[col] || 0);
    }, 0);

    const ratio = timeAmount / total;
    const score = Math.min(ratio / this.MAX_RATIO, 1);
    const ratioPercent = (ratio * 100).toFixed(1);

    return {
      score,
      explanation: `${timeLabel} 매출 비중 ${ratioPercent}%`,
      breakdown,
      selectedTime: targetTime,
    };
  }
}
