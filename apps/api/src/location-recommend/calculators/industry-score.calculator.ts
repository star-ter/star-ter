import { Injectable } from '@nestjs/common';

@Injectable()
export class IndustryScoreCalculator {
  // 밀도 임계값 (상세페이지와 동일)
  private readonly DENSITY_THRESHOLDS = { HIGH: 0.0005, MEDIUM: 0.0002 };

  /**
   * 업종 점수 계산 (0~1)
   *
   * @param totalSales 상권 전체 매출
   * @param industrySales 상권 내 해당 업종 매출
   * @param avgIndustrySales 전체 상권 평균 해당 업종 매출
   * @param density 해당 상권의 업종 점포 밀도 (점포수/면적)
   * @param avgDensity 전체 상권 평균 업종 점포 밀도
   */
  calculate(
    totalSales: number,
    industrySales: number,
    avgIndustrySales: number,
    density: number = 0,
    avgDensity: number = 0,
  ): number {
    // 데이터 없으면 중립 점수
    if (totalSales === 0 || avgIndustrySales === 0) {
      return 0.5;
    }

    // 해당 상권에 선택한 업종이 없으면 중립 점수 (데이터 미검증)
    if (industrySales === 0) {
      return 0.5;
    }

    // 1. 매출 기반 경쟁도 (0~1, 높을수록 좋음)
    const industryShare = industrySales / totalSales;
    const salesCompetitionScore = 1 - industryShare;

    // 2. 밀도 기반 경쟁도 (0~1, 밀도 낮을수록 좋음)
    let densityScore = 0.5; // 기본값 (밀도 데이터 없으면 중립)
    if (avgDensity > 0 && density >= 0) {
      // 평균 대비 밀도가 낮을수록 좋음
      const densityRatio = density / avgDensity;
      densityScore = Math.max(0, 1 - Math.min(1, densityRatio));

      // 절대적 기준 보정 (상세페이지 기준 반영)
      if (density >= this.DENSITY_THRESHOLDS.HIGH) {
        densityScore = Math.min(densityScore, 0.2); // 위험 수준이면 최대 0.2
      } else if (density >= this.DENSITY_THRESHOLDS.MEDIUM) {
        densityScore = Math.min(densityScore, 0.5); // 경계 수준이면 최대 0.5
      }
    }

    // 3. 수요 점수 (0~1, 높을수록 좋음)
    const industryDemand = industrySales / avgIndustrySales;
    const demandScore = Math.min(1, industryDemand);

    // 4. 최종 업종 점수 (매출경쟁 30% + 밀도경쟁 30% + 수요 40%)
    const industryScore =
      salesCompetitionScore * 0.3 + densityScore * 0.3 + demandScore * 0.4;

    return industryScore;
  }

  /**
   * 점수 + 설명 함께 반환
   */
  calculateWithExplanation(
    totalSales: number,
    industrySales: number,
    avgIndustrySales: number,
    density: number = 0,
    avgDensity: number = 0,
    storeCount: number = 0,
  ): { score: number; explanation: string } {
    // 데이터 없으면 중립 점수
    if (totalSales === 0 || avgIndustrySales === 0) {
      return {
        score: 0.5,
        explanation: '업종 데이터가 없습니다',
      };
    }

    // 해당 상권에 선택한 업종이 없으면 중립 점수
    if (industrySales === 0) {
      return {
        score: 0.5,
        explanation: '해당 업종 점포가 없습니다',
      };
    }

    const score = this.calculate(
      totalSales,
      industrySales,
      avgIndustrySales,
      density,
      avgDensity,
    );

    // 밀도 레벨 결정
    let densityLevel = '낮음';
    if (density >= this.DENSITY_THRESHOLDS.HIGH) {
      densityLevel = '높음 (경쟁 치열)';
    } else if (density >= this.DENSITY_THRESHOLDS.MEDIUM) {
      densityLevel = '보통';
    }

    const industryShare = ((industrySales / totalSales) * 100).toFixed(1);

    return {
      score,
      explanation: `동일 업종 ${storeCount}개, 업종 점유율 ${industryShare}%, 밀도 ${densityLevel}`,
    };
  }
}
