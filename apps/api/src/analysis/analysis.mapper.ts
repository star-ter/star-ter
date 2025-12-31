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
  mon: 'mon',
  tue: 'tues',
  wed: 'wed',
  thu: 'thur',
  fri: 'fri',
  sat: 'sat',
  sun: 'sun',
};

const TIME_SLOTS = [
  { key: 'tmzon_00_06', label: '00~06' },
  { key: 'tmzon_06_11', label: '06~11' },
  { key: 'tmzon_11_14', label: '11~14' },
  { key: 'tmzon_14_17', label: '14~17' },
  { key: 'tmzon_17_21', label: '17~21' },
  { key: 'tmzon_21_24', label: '21~24' },
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

    const totalSales = BigInt(s.thsmon_selng_amt || 0);

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
          male: Number(s.ml_selng_amt || 0),
          female: Number(s.fml_selng_amt || 0),
        },
        age: {
          a10: Number(s.agrde_10_selng_amt || 0),
          a20: Number(s.agrde_20_selng_amt || 0),
          a30: Number(s.agrde_30_selng_amt || 0),
          a40: Number(s.agrde_40_selng_amt || 0),
          a50: Number(s.agrde_50_selng_amt || 0),
          a60: Number(s.agrde_60_above_selng_amt || 0),
        },
      },
      store: {
        total: (st.stor_co as number) || 0,
        categories: storeCategories.slice(0, 30),
        openingRate: this.calculateRate(
          st.opbiz_stor_co as number,
          st.stor_co as number,
        ),
        closingRate: this.calculateRate(
          st.clsbiz_stor_co as number,
          st.stor_co as number,
        ),
      },
      population: p.tot_repop_co
        ? {
            total: p.tot_repop_co || 0,
            male: (p.ml_repop_co as number) || 0,
            female: (p.fml_repop_co as number) || 0,
            age: {
              a10: (p.agrde_10_repop_co as number) || 0,
              a20: (p.agrde_20_repop_co as number) || 0,
              a30: (p.agrde_30_repop_co as number) || 0,
              a40: (p.agrde_40_repop_co as number) || 0,
              a50: (p.agrde_50_repop_co as number) || 0,
              a60: (p.agrde_60_above_repop_co as number) || 0,
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
      trendMap.set(g.stdr_yyqu_cd, Number(g._sum.thsmon_selng_amt || 0));
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
      const val = Number(salesSum[`${DAY_KEY_MAP[day]}_selng_amt`] || 0);
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
      const val = Number(salesSum[`${t.key}_selng_amt`] || 0);
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
        name: g.svc_induty_cd_nm,
        count: (g._sum.stor_co as number) || 0,
        open: (g._sum.opbiz_stor_co as number) || 0,
        close: (g._sum.clsbiz_stor_co as number) || 0,
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
