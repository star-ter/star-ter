import { Injectable } from '@nestjs/common';
import { RegionData } from '../repositories/region.repository';

/**
 * 지역 테마 점수 계산
 *
 * 통일된 설계 원칙:
 * - 모든 테마는 "충분하면 만점" 방식 (min(ratio / threshold, 1))
 * - 점수는 "테마 성립 조건 충족도"를 의미
 * - 설명 가능한 만점 기준 적용
 *
 * 테마별 만점 기준:
 * - office: 직장인 비중 30% 이상
 * - residential: 거주인 비중 40% 이상 + 아파트 보너스
 * - commercial: 유동인구 비중 40% 이상
 * - university: 20대 비중 30% 이상 + 대학 보너스
 * - station: 지하철역 존재 여부 (binary)
 * - tourist: 관광/숙박 시설 5개 이상
 */

const THEME_LABEL_MAP: Record<string, string> = {
  office: '오피스',
  residential: '주거지역',
  commercial: '핫플레이스',
  university: '대학가',
  station: '역세권',
  tourist: '관광지',
};

@Injectable()
export class RegionScoreCalculator {
  // 테마별 만점 기준 (비중)
  private readonly THRESHOLDS = {
    OFFICE: 0.3, // 직장인 30% 이상이면 만점
    RESIDENTIAL: 0.4, // 거주인 40% 이상이면 만점
    COMMERCIAL: 0.4, // 유동인구 40% 이상이면 만점
    UNIVERSITY: 0.3, // 20대 30% 이상이면 만점
    TOURIST_FACILITIES: 5, // 관광/숙박 시설 5개 이상이면 만점
  };

  // 보너스 점수
  private readonly BONUSES = {
    APT_WEIGHT: 0.15, // 아파트 세대 많으면 +0.15 (최대)
  };

  // 가중치 (필수/지배 조건)
  // university: 20대 비중으로 기본 점수 계산, 대학이 없으면 강한 패널티 적용 (최대 40%)
  private readonly WEIGHTS = {
    UNIVERSITY_WITH_UNIV: 1, // 대학 존재시 100%
    UNIVERSITY_WITHOUT_UNIV: 0.4, // 대학 미존재시 40% (패널티)
  };

  /**
   * 지역 테마 점수 계산 (0~1)
   * @param theme 사용자가 선택한 테마
   * @param data 해당 상권의 인구/시설 데이터
   * @param _maxPopulation 사용하지 않음 (하위 호환성 유지)
   */
  calculate(
    theme: string,
    data: RegionData | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _maxPopulation?: number, // 하위 호환성 유지 (내부적으로 미사용)
  ): number {
    if (!data) return 0.5; // 데이터 없으면 중립 점수

    // 상권 전체 인구 (직장인 + 거주자 + 유동인구)
    const totalPop =
      data.tot_wrc_popltn_co + data.tot_repop_co + data.tot_flpop_co;

    if (totalPop === 0) return 0.5;

    switch (theme) {
      case 'office': {
        // 직장인 비중: 30% 이상이면 만점
        const ratio = data.tot_wrc_popltn_co / totalPop;
        return Math.min(ratio / this.THRESHOLDS.OFFICE, 1);
      }

      case 'residential': {
        // 거주인 비중: 40% 이상이면 만점
        const residentialRatio = data.tot_repop_co / totalPop;
        const baseScore = Math.min(
          residentialRatio / this.THRESHOLDS.RESIDENTIAL,
          1,
        );

        // 아파트 보너스: 세대수가 많으면 최대 +0.15
        // 기준: 1000세대 이상이면 최대 보너스
        const aptBonus =
          Math.min(data.apt_hshld_co / 1000, 1) * this.BONUSES.APT_WEIGHT;

        return Math.min(baseScore + aptBonus, 1);
      }

      case 'commercial': {
        // 유동인구 비중: 40% 이상이면 만점
        // (절대값이 아닌 비중으로 계산 → 소규모 상권도 공정하게 평가)
        const commercialRatio = data.tot_flpop_co / totalPop;
        return Math.min(commercialRatio / this.THRESHOLDS.COMMERCIAL, 1);
      }

      case 'university': {
        // 20대 비중으로 기본 점수 계산
        // 대학이 없으면 점수에 강한 패널티 적용 (최대 40%)
        const twentiesRatio =
          data.tot_flpop_co > 0
            ? data.agrde_20_flpop_co / data.tot_flpop_co
            : 0;

        const baseScore = Math.min(
          twentiesRatio / this.THRESHOLDS.UNIVERSITY,
          1,
        );

        const univWeight =
          data.univ_co > 0
            ? this.WEIGHTS.UNIVERSITY_WITH_UNIV
            : this.WEIGHTS.UNIVERSITY_WITHOUT_UNIV;

        return baseScore * univWeight;
      }

      case 'station': {
        // 지하철역 존재 여부 (binary)
        // v1: 단순 존재 여부, v2에서 역 개수/거리 반영 가능
        return data.subway_statn_co > 0 ? 1 : 0;
      }

      case 'tourist': {
        // 관광/숙박 시설 수: 5개 이상이면 만점
        const facilityCount = data.viatr_fclty_co + data.stayng_fclty_co;
        return Math.min(facilityCount / this.THRESHOLDS.TOURIST_FACILITIES, 1);
      }

      default:
        return 0.5;
    }
  }

  /**
   * 점수 + 설명 + 상권 세부 정보 함께 반환
   */
  calculateWithExplanation(
    theme: string,
    data: RegionData | undefined,
  ): {
    score: number;
    explanation: string;
    details: {
      theme: string;
      themeLabel: string;
      mainAgeGroup: string;
      mainAgeRatio: number;
      nearbyUniversities: number;
      nearbySubways: number;
      footTraffic: number;
    };
  } {
    const themeLabel = THEME_LABEL_MAP[theme] || theme;

    // 기본 details
    const details = {
      theme,
      themeLabel,
      mainAgeGroup: '-',
      mainAgeRatio: 0,
      nearbyUniversities: 0,
      nearbySubways: 0,
      footTraffic: 0,
    };

    if (!data) {
      return {
        score: 0.5,
        explanation: `상권 데이터가 없습니다`,
        details,
      };
    }

    // 상세 정보 채우기
    details.nearbyUniversities = data.univ_co;
    details.nearbySubways = data.subway_statn_co;
    details.footTraffic = data.tot_flpop_co;

    // 주요 연령층 계산 (유동인구 기준 20대 비중)
    if (data.tot_flpop_co > 0) {
      const twentiesRatio = (data.agrde_20_flpop_co / data.tot_flpop_co) * 100;
      details.mainAgeGroup = '20대';
      details.mainAgeRatio = twentiesRatio;
    }

    const totalPop =
      data.tot_wrc_popltn_co + data.tot_repop_co + data.tot_flpop_co;

    if (totalPop === 0) {
      return {
        score: 0.5,
        explanation: `인구 데이터가 없습니다`,
        details,
      };
    }

    switch (theme) {
      case 'office': {
        const ratio = data.tot_wrc_popltn_co / totalPop;
        const score = Math.min(ratio / this.THRESHOLDS.OFFICE, 1);
        return {
          score,
          explanation: `직장인 비중 ${(ratio * 100).toFixed(1)}%`,
          details,
        };
      }

      case 'residential': {
        const residentialRatio = data.tot_repop_co / totalPop;
        const baseScore = Math.min(
          residentialRatio / this.THRESHOLDS.RESIDENTIAL,
          1,
        );
        const aptBonus =
          Math.min(data.apt_hshld_co / 1000, 1) * this.BONUSES.APT_WEIGHT;
        const score = Math.min(baseScore + aptBonus, 1);
        const aptInfo =
          data.apt_hshld_co > 0 ? `, 아파트 ${data.apt_hshld_co}세대` : '';
        return {
          score,
          explanation: `거주 인구 비중 ${(residentialRatio * 100).toFixed(1)}%${aptInfo}`,
          details,
        };
      }

      case 'commercial': {
        const commercialRatio = data.tot_flpop_co / totalPop;
        const score = Math.min(commercialRatio / this.THRESHOLDS.COMMERCIAL, 1);
        return {
          score,
          explanation: `유동인구 비중 ${(commercialRatio * 100).toFixed(1)}%`,
          details,
        };
      }

      case 'university': {
        const twentiesRatio =
          data.tot_flpop_co > 0
            ? data.agrde_20_flpop_co / data.tot_flpop_co
            : 0;
        const baseScore = Math.min(
          twentiesRatio / this.THRESHOLDS.UNIVERSITY,
          1,
        );
        const univWeight =
          data.univ_co > 0
            ? this.WEIGHTS.UNIVERSITY_WITH_UNIV
            : this.WEIGHTS.UNIVERSITY_WITHOUT_UNIV;
        const score = baseScore * univWeight;
        const univInfo =
          data.univ_co > 0 ? `, 대학 ${data.univ_co}개` : ' (인근 대학 없음)';
        return {
          score,
          explanation: `20대 비중 ${(twentiesRatio * 100).toFixed(1)}%${univInfo}`,
          details,
        };
      }

      case 'station': {
        const score = data.subway_statn_co > 0 ? 1 : 0;
        return {
          score,
          explanation:
            data.subway_statn_co > 0
              ? `지하철역 ${data.subway_statn_co}개`
              : '인근 지하철역 없음',
          details,
        };
      }

      case 'tourist': {
        const facilityCount = data.viatr_fclty_co + data.stayng_fclty_co;
        const score = Math.min(
          facilityCount / this.THRESHOLDS.TOURIST_FACILITIES,
          1,
        );
        return {
          score,
          explanation: `관광/숙박 시설 ${facilityCount}개`,
          details,
        };
      }

      default:
        return {
          score: 0.5,
          explanation: `${themeLabel} 테마`,
          details,
        };
    }
  }
}
