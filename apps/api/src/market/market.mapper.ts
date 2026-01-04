import {
  IndustryCategoryBreakdown,
  MarketAnalyticsDto,
} from './dto/market-analytics.dto';
import { INDUSTRY_MAPPING, MACRO_CATEGORIES } from './utils/industry-mapping';

interface SalesSum {
  thsmon_selng_amt?: number | bigint | null;
  tmzon_00_06_selng_amt?: number | bigint | null;
  tmzon_06_11_selng_amt?: number | bigint | null;
  tmzon_11_14_selng_amt?: number | bigint | null;
  tmzon_14_17_selng_amt?: number | bigint | null;
  tmzon_17_21_selng_amt?: number | bigint | null;
  tmzon_21_24_selng_amt?: number | bigint | null;
  mon_selng_amt?: number | bigint | null;
  tues_selng_amt?: number | bigint | null;
  wed_selng_amt?: number | bigint | null;
  thur_selng_amt?: number | bigint | null;
  fri_selng_amt?: number | bigint | null;
  sat_selng_amt?: number | bigint | null;
  sun_selng_amt?: number | bigint | null;
  ml_selng_amt?: number | bigint | null;
  fml_selng_amt?: number | bigint | null;
  agrde_10_selng_amt?: number | bigint | null;
  agrde_20_selng_amt?: number | bigint | null;
  agrde_30_selng_amt?: number | bigint | null;
  agrde_40_selng_amt?: number | bigint | null;
  agrde_50_selng_amt?: number | bigint | null;
  agrde_60_above_selng_amt?: number | bigint | null;
}

interface AggregatedSalesRow {
  stdr_yyqu_cd: string;
  _sum: SalesSum;
}

// 업종별 매출 데이터 타입 (repository에서 groupBy 결과)
interface IndustryData {
  svc_induty_cd: string;
  svc_induty_cd_nm: string;
  _sum: {
    thsmon_selng_amt: number | bigint | null;
  };
}

export class MarketMapper {
  /**
   * 매출 분석 DTO 매핑
   * @param groupedRows - 분기별 매출 데이터
   * @param areaName - 지역명
   * @param isCommercial - 상권 여부
   * @param openingRate - 개업률
   * @param closureRate - 폐업률
   * @param industries - 모든 업종별 매출 데이터
   */
  static mapToAnalyticsDto(
    groupedRows: AggregatedSalesRow[],
    areaName: string,
    isCommercial: boolean,
    openingRate: number = 0,
    closureRate: number = 0,
    industries: IndustryData[] = [],
  ): MarketAnalyticsDto {
    if (!groupedRows || groupedRows.length === 0) {
      return this.getEmptySalesData(`${areaName} (데이터 없음)`);
    }

    const latest = groupedRows[0];
    const sum = latest._sum || {};

    // Helper to safely get number
    const val = (v: bigint | number | null | undefined) => Number(v || 0);

    // 1. 기존 Top 5 유지 및 비율 계산
    const top5 = industries.slice(0, 5);
    const totalIndustryRevenue = industries.reduce(
      (acc, item) => acc + val(item._sum.thsmon_selng_amt),
      0,
    );
    const mappedTopIndustries = top5.map((item) => ({
      name: item.svc_induty_cd_nm,
      ratio:
        totalIndustryRevenue > 0
          ? val(item._sum.thsmon_selng_amt) / totalIndustryRevenue
          : 0,
    }));

    // 2. 대분류별 그룹화 (Industry Breakdown)
    const breakdownMap = new Map<string, IndustryCategoryBreakdown>();

    industries.forEach((item) => {
      const macroCode = INDUSTRY_MAPPING[item.svc_induty_cd];
      const macroName = macroCode ? MACRO_CATEGORIES[macroCode] : '기타';
      const revenue = val(item._sum.thsmon_selng_amt);

      const mapKey = macroCode || 'ETC';
      if (!breakdownMap.has(mapKey)) {
        breakdownMap.set(mapKey, {
          macroCode: mapKey,
          macroName,
          totalRevenue: 0,
          subIndustries: [],
        });
      }

      const macroInfo = breakdownMap.get(mapKey)!;
      macroInfo.totalRevenue += revenue;
      macroInfo.subIndustries.push({
        code: item.svc_induty_cd,
        name: item.svc_induty_cd_nm,
        revenue,
      });
    });

    // 정렬: 대분류 매출순
    const industryBreakdown = Array.from(breakdownMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );
    // 하위 업종도 매출순 정렬
    industryBreakdown.forEach((cat) => {
      cat.subIndustries.sort((a, b) => b.revenue - a.revenue);
    });

    return {
      areaName,
      isCommercialArea: isCommercial,
      totalRevenue: val(sum.thsmon_selng_amt),
      sales: {
        trend: groupedRows
          .slice(0, 4)
          .reverse()
          .map((row) => ({
            year: row.stdr_yyqu_cd.substring(0, 4),
            quarter: row.stdr_yyqu_cd.substring(4, 5),
            revenue: val(row._sum.thsmon_selng_amt),
          })),
        timeSlot: {
          time0006: val(sum.tmzon_00_06_selng_amt),
          time0611: val(sum.tmzon_06_11_selng_amt),
          time1114: val(sum.tmzon_11_14_selng_amt),
          time1417: val(sum.tmzon_14_17_selng_amt),
          time1721: val(sum.tmzon_17_21_selng_amt),
          time2124: val(sum.tmzon_21_24_selng_amt),
          peakTimeSummaryComment: '시간대별 매출 분포입니다.',
        },
        dayOfWeek: {
          mon: val(sum.mon_selng_amt),
          tue: val(sum.tues_selng_amt),
          wed: val(sum.wed_selng_amt),
          thu: val(sum.thur_selng_amt),
          fri: val(sum.fri_selng_amt),
          sat: val(sum.sat_selng_amt),
          sun: val(sum.sun_selng_amt),
          peakDaySummaryComment: '요일별 매출 분포입니다.',
        },
        demographics: {
          male: val(sum.ml_selng_amt),
          female: val(sum.fml_selng_amt),
          age10: val(sum.agrde_10_selng_amt),
          age20: val(sum.agrde_20_selng_amt),
          age30: val(sum.agrde_30_selng_amt),
          age40: val(sum.agrde_40_selng_amt),
          age50: val(sum.agrde_50_selng_amt),
          age60: val(sum.agrde_60_above_selng_amt),
          primaryGroupSummaryComment: '성별/연령별 매출 분포입니다.',
        },
        topIndustries: mappedTopIndustries,
        industryBreakdown,
      },
      vitality: {
        openingRate: Math.round(openingRate * 10) / 10,
        closureRate: Math.round(closureRate * 10) / 10,
      },
      openingRate: Math.round(openingRate * 10) / 10,
      closureRate: Math.round(closureRate * 10) / 10,
    };
  }

  static getEmptySalesData(message: string): MarketAnalyticsDto {
    return {
      areaName: message,
      isCommercialArea: false,
      totalRevenue: 0,
      sales: {
        trend: [],
        timeSlot: {
          time0006: 0,
          time0611: 0,
          time1114: 0,
          time1417: 0,
          time1721: 0,
          time2124: 0,
          peakTimeSummaryComment: '데이터 없음',
        },
        dayOfWeek: {
          mon: 0,
          tue: 0,
          wed: 0,
          thu: 0,
          fri: 0,
          sat: 0,
          sun: 0,
          peakDaySummaryComment: '데이터 없음',
        },
        demographics: {
          male: 0,
          female: 0,
          age10: 0,
          age20: 0,
          age30: 0,
          age40: 0,
          age50: 0,
          age60: 0,
          primaryGroupSummaryComment: '데이터 없음',
        },
        topIndustries: [],
      },
      vitality: { openingRate: 0, closureRate: 0 },
      openingRate: 0,
      closureRate: 0,
    };
  }
}
