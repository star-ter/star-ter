import { MarketAnalyticsDto } from './dto/market-analytics.dto';

interface SalesSum {
  THSMON_SELNG_AMT?: number | bigint | null;
  TMZON_00_06_SELNG_AMT?: number | bigint | null;
  TMZON_06_11_SELNG_AMT?: number | bigint | null;
  TMZON_11_14_SELNG_AMT?: number | bigint | null;
  TMZON_14_17_SELNG_AMT?: number | bigint | null;
  TMZON_17_21_SELNG_AMT?: number | bigint | null;
  TMZON_21_24_SELNG_AMT?: number | bigint | null;
  MON_SELNG_AMT?: number | bigint | null;
  TUES_SELNG_AMT?: number | bigint | null;
  WED_SELNG_AMT?: number | bigint | null;
  THUR_SELNG_AMT?: number | bigint | null;
  FRI_SELNG_AMT?: number | bigint | null;
  SAT_SELNG_AMT?: number | bigint | null;
  SUN_SELNG_AMT?: number | bigint | null;
  ML_SELNG_AMT?: number | bigint | null;
  FML_SELNG_AMT?: number | bigint | null;
  AGRDE_10_SELNG_AMT?: number | bigint | null;
  AGRDE_20_SELNG_AMT?: number | bigint | null;
  AGRDE_30_SELNG_AMT?: number | bigint | null;
  AGRDE_40_SELNG_AMT?: number | bigint | null;
  AGRDE_50_SELNG_AMT?: number | bigint | null;
  AGRDE_60_ABOVE_SELNG_AMT?: number | bigint | null;
}

interface AggregatedSalesRow {
  STDR_YYQU_CD: string;
  _sum: SalesSum;
}

export class MarketMapper {
  static mapToAnalyticsDto(
    groupedRows: AggregatedSalesRow[],
    areaName: string,
    isCommercial: boolean,
  ): MarketAnalyticsDto {
    if (!groupedRows || groupedRows.length === 0) {
      return this.getEmptySalesData(`${areaName} (데이터 없음)`);
    }

    const latest = groupedRows[0];
    const sum = latest._sum || {};

    // Helper to safely get number
    const val = (v: bigint | number | null | undefined) => Number(v || 0);

    return {
      areaName,
      isCommercialArea: isCommercial,
      totalRevenue: val(sum.THSMON_SELNG_AMT),
      sales: {
        trend: groupedRows
          .slice(0, 4)
          .reverse()
          .map((row) => ({
            year: row.STDR_YYQU_CD.substring(0, 4),
            quarter: row.STDR_YYQU_CD.substring(4, 5),
            revenue: val(row._sum.THSMON_SELNG_AMT),
          })),
        timeSlot: {
          time0006: val(sum.TMZON_00_06_SELNG_AMT),
          time0611: val(sum.TMZON_06_11_SELNG_AMT),
          time1114: val(sum.TMZON_11_14_SELNG_AMT),
          time1417: val(sum.TMZON_14_17_SELNG_AMT),
          time1721: val(sum.TMZON_17_21_SELNG_AMT),
          time2124: val(sum.TMZON_21_24_SELNG_AMT),
          peakTimeSummaryComment: '시간대별 매출 분포입니다.',
        },
        dayOfWeek: {
          mon: val(sum.MON_SELNG_AMT),
          tue: val(sum.TUES_SELNG_AMT),
          wed: val(sum.WED_SELNG_AMT),
          thu: val(sum.THUR_SELNG_AMT),
          fri: val(sum.FRI_SELNG_AMT),
          sat: val(sum.SAT_SELNG_AMT),
          sun: val(sum.SUN_SELNG_AMT),
          peakDaySummaryComment: '요일별 매출 분포입니다.',
        },
        demographics: {
          male: val(sum.ML_SELNG_AMT),
          female: val(sum.FML_SELNG_AMT),
          age10: val(sum.AGRDE_10_SELNG_AMT),
          age20: val(sum.AGRDE_20_SELNG_AMT),
          age30: val(sum.AGRDE_30_SELNG_AMT),
          age40: val(sum.AGRDE_40_SELNG_AMT),
          age50: val(sum.AGRDE_50_SELNG_AMT),
          age60: val(sum.AGRDE_60_ABOVE_SELNG_AMT),
          primaryGroupSummaryComment: '성별/연령별 매출 분포입니다.',
        },
        topIndustries: [],
      },
      vitality: { openingRate: 0, closureRate: 0 },
      openingRate: 0,
      closureRate: 0,
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
