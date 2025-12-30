import { SalesCommercial, SalesDong } from 'generated/prisma/client';
import { MarketAnalyticsDto } from './dto/market-analytics.dto';

export class MarketMapper {
  static mapToAnalyticsDto(
    rows: (SalesCommercial | SalesDong)[],
    areaName: string,
    isCommercial: boolean,
  ): MarketAnalyticsDto {
    if (!rows || rows.length === 0) {
      return this.getEmptySalesData(`${areaName} (데이터 없음)`);
    }
    const latest = rows[0];
    return {
      areaName,
      isCommercialArea: isCommercial,
      totalRevenue: Number(latest.THSMON_SELNG_AMT),
      sales: {
        trend: rows
          .slice(0, 4)
          .reverse()
          .map((row) => ({
            year: row.STDR_YYQU_CD.substring(0, 4),
            quarter: row.STDR_YYQU_CD.substring(4, 5),
            revenue: Number(row.THSMON_SELNG_AMT),
          })),
        timeSlot: {
          time0006: Number(latest.TMZON_00_06_SELNG_AMT),
          time0611: Number(latest.TMZON_06_11_SELNG_AMT),
          time1114: Number(latest.TMZON_11_14_SELNG_AMT),
          time1417: Number(latest.TMZON_14_17_SELNG_AMT),
          time1721: Number(latest.TMZON_17_21_SELNG_AMT),
          time2124: Number(latest.TMZON_21_24_SELNG_AMT),
          peakTimeSummaryComment: '시간대별 매출 분포입니다.',
        },
        dayOfWeek: {
          mon: Number(latest.MON_SELNG_AMT),
          tue: Number(latest.TUES_SELNG_AMT),
          wed: Number(latest.WED_SELNG_AMT),
          thu: Number(latest.THUR_SELNG_AMT),
          fri: Number(latest.FRI_SELNG_AMT),
          sat: Number(latest.SAT_SELNG_AMT),
          sun: Number(latest.SUN_SELNG_AMT),
          peakDaySummaryComment: '요일별 매출 분포입니다.',
        },
        demographics: {
          male: Number(latest.ML_SELNG_AMT),
          female: Number(latest.FML_SELNG_AMT),
          age10: Number(latest.AGRDE_10_SELNG_AMT),
          age20: Number(latest.AGRDE_20_SELNG_AMT),
          age30: Number(latest.AGRDE_30_SELNG_AMT),
          age40: Number(latest.AGRDE_40_SELNG_AMT),
          age50: Number(latest.AGRDE_50_SELNG_AMT),
          age60: Number(latest.AGRDE_60_ABOVE_SELNG_AMT),
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
