import {
  SalesAggregate,
  StoreAggregate,
  PopulationAggregate,
  StoreCategoryGroup,
  SalesTrendGroup,
  AnalysisResponse,
  DayOfWeekSalesItem,
  TimeOfDaySalesItem,
  StoreCategoryItem,
} from './dto/analysis.types';

const DAY_KEY_MAP: Record<string, string> = {
  mon: 'MON',
  tue: 'TUES',
  wed: 'WED',
  thu: 'THUR',
  fri: 'FRI',
  sat: 'SAT',
  sun: 'SUN',
};

const TIME_SLOTS = [
  { key: 'TMZON_00_06', label: '00~06' },
  { key: 'TMZON_06_11', label: '06~11' },
  { key: 'TMZON_11_14', label: '11~14' },
  { key: 'TMZON_14_17', label: '14~17' },
  { key: 'TMZON_17_21', label: '17~21' },
  { key: 'TMZON_21_24', label: '21~24' },
];

export class AnalysisMapper {
  static toAnalysisResponse(
    salesAgg: SalesAggregate,
    storeAgg: StoreAggregate,
    popAgg: PopulationAggregate,
    storeGroups: StoreCategoryGroup[],
    trendGroups: SalesTrendGroup[],
    meta: {
      regionCode: string;
      codes: string[];
      type: string;
      stdrYyquCd: string;
      quartersToFetch: string[];
    },
  ): AnalysisResponse {
    const s = salesAgg._sum;
    const st = storeAgg._sum;
    const p = popAgg._sum;

    const totalSales = BigInt(s.THSMON_SELNG_AMT || 0);

    const trendData = this.mapSalesTrend(trendGroups, meta.quartersToFetch);
    const storeCategories = this.mapStoreCategories(storeGroups);

    return {
      meta: {
        yearQuarter: meta.stdrYyquCd,
        regionCode: meta.regionCode,
        matchedRegions: meta.codes,
        type: meta.type,
      },
      sales: {
        total: totalSales.toString(),
        trend: trendData,
        dayOfWeek: this.mapDayOfWeekSales(s, totalSales),
        timeOfDay: this.mapTimeOfDaySales(s, totalSales),
        gender: {
          male: Number(s.ML_SELNG_AMT || 0),
          female: Number(s.FML_SELNG_AMT || 0),
        },
        age: {
          a10: Number(s.AGRDE_10_SELNG_AMT || 0),
          a20: Number(s.AGRDE_20_SELNG_AMT || 0),
          a30: Number(s.AGRDE_30_SELNG_AMT || 0),
          a40: Number(s.AGRDE_40_SELNG_AMT || 0),
          a50: Number(s.AGRDE_50_SELNG_AMT || 0),
          a60: Number(s.AGRDE_60_ABOVE_SELNG_AMT || 0),
        },
      },
      store: {
        total: (st.STOR_CO as number) || 0,
        categories: storeCategories.slice(0, 30),
        openingRate: this.calculateRate(
          st.OPBIZ_STOR_CO as number,
          st.STOR_CO as number,
        ),
        closingRate: this.calculateRate(
          st.CLSBIZ_STOR_CO as number,
          st.STOR_CO as number,
        ),
      },
      population: p.TOT_REPOP_CO
        ? {
            total: p.TOT_REPOP_CO || 0,
            male: (p.ML_REPOP_CO as number) || 0,
            female: (p.FML_REPOP_CO as number) || 0,
            age: {
              a10: (p.AGRDE_10_REPOP_CO as number) || 0,
              a20: (p.AGRDE_20_REPOP_CO as number) || 0,
              a30: (p.AGRDE_30_REPOP_CO as number) || 0,
              a40: (p.AGRDE_40_REPOP_CO as number) || 0,
              a50: (p.AGRDE_50_REPOP_CO as number) || 0,
              a60: (p.AGRDE_60_ABOVE_REPOP_CO as number) || 0,
            },
          }
        : null,
    };
  }

  private static mapSalesTrend(
    trendGroups: SalesTrendGroup[],
    quartersToFetch: string[],
  ) {
    const trendMap = new Map<string, number>();
    trendGroups.forEach((g) => {
      trendMap.set(g.STDR_YYQU_CD, Number(g._sum.THSMON_SELNG_AMT || 0));
    });
    return quartersToFetch.map((q) => ({
      period: q,
      sales: trendMap.get(q) || 0,
    }));
  }

  private static mapDayOfWeekSales(
    salesSum: Record<string, bigint | number | null>,
    total: bigint,
  ): DayOfWeekSalesItem[] {
    return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
      const val = Number(salesSum[`${DAY_KEY_MAP[day]}_SELNG_AMT`] || 0);
      return {
        day,
        sales: val,
        percentage: (val / Number(total || 1)) * 100,
      };
    });
  }

  private static mapTimeOfDaySales(
    salesSum: Record<string, bigint | number | null>,
    total: bigint,
  ): TimeOfDaySalesItem[] {
    return TIME_SLOTS.map((t) => {
      const val = Number(salesSum[`${t.key}_SELNG_AMT`] || 0);
      return {
        time: t.label,
        sales: val,
        percentage: (val / Number(total || 1)) * 100,
      };
    });
  }

  private static mapStoreCategories(
    groups: StoreCategoryGroup[],
  ): StoreCategoryItem[] {
    return groups
      .map((g) => ({
        name: g.SVC_INDUTY_CD_NM,
        count: (g._sum.STOR_CO as number) || 0,
        open: (g._sum.OPBIZ_STOR_CO as number) || 0,
        close: (g._sum.CLSBIZ_STOR_CO as number) || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private static calculateRate(
    numerator: number | null,
    denominator: number | null,
  ): number {
    const num = numerator || 0;
    const den = denominator || 0;
    return den > 0 ? (num / den) * 100 : 0;
  }
}
