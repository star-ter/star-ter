import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SalesRow,
  StoreRow,
  PopulationRow,
  AnalysisResponse,
} from '../types/analysis';

@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}

  async getAnalysis(
    regionCode: string,
  ): Promise<AnalysisResponse | { error: string }> {
    let codes: string[] = [];
    let type: 'GU' | 'DONG' | 'COMMERCIAL' = 'COMMERCIAL';

    if (!isNaN(Number(regionCode))) {
      const gu = await this.prisma.areaGu.findFirst({
        where: { SIGNGU_CD: regionCode },
      });
      if (gu) {
        type = 'GU';
        codes = [regionCode];
      } else {
        const dong = await this.prisma.areaDong.findFirst({
          where: { ADSTRD_CD: regionCode },
        });
        if (dong) {
          type = 'DONG';
          codes = [regionCode];
        } else {
          type = 'COMMERCIAL';
          codes = [regionCode];
        }
      }
    } else {
      const keywords = regionCode.trim().split(/\s+/);

      const searchInTables = async (term: string) => {
        let processTerm = term;

        const endsWithGu = term.endsWith('구');
        const endsWithDong = term.endsWith('동');

        if (endsWithDong && processTerm.length > 2) {
          processTerm = processTerm.slice(0, -1);
        }

        if (endsWithGu) {
          let guList = await this.prisma.areaGu.findMany({
            where: { SIGNGU_NM: { equals: term } },
          });
          if (guList.length === 0) {
            guList = await this.prisma.areaGu.findMany({
              where: { SIGNGU_NM: { contains: term } },
            });
          }
          if (guList.length > 0)
            return { type: 'GU', codes: [guList[0].SIGNGU_CD] };
        }

        if (endsWithDong) {
          let dongList = await this.prisma.areaDong.findMany({
            where: { ADSTRD_NM: { equals: processTerm } },
          });
          if (dongList.length === 0) {
            dongList = await this.prisma.areaDong.findMany({
              where: { ADSTRD_NM: { contains: processTerm } },
            });
          }
          if (dongList.length > 0)
            return { type: 'DONG', codes: [dongList[0].ADSTRD_CD] };
        }

        if (!endsWithGu && !endsWithDong) {
          let guList = await this.prisma.areaGu.findMany({
            where: { SIGNGU_NM: { equals: term } },
          });
          if (guList.length === 0) {
            guList = await this.prisma.areaGu.findMany({
              where: { SIGNGU_NM: { contains: term } },
            });
          }
          if (guList.length > 0)
            return { type: 'GU', codes: [guList[0].SIGNGU_CD] };

          let dongList = await this.prisma.areaDong.findMany({
            where: { ADSTRD_NM: { equals: term } },
          });
          if (dongList.length === 0) {
            dongList = await this.prisma.areaDong.findMany({
              where: { ADSTRD_NM: { contains: term } },
            });
          }
          if (dongList.length > 0)
            return { type: 'DONG', codes: [dongList[0].ADSTRD_CD] };

          let commList = await this.prisma.areaCommercial.findMany({
            where: { TRDAR_CD_NM: { equals: term } },
          });
          if (commList.length === 0) {
            commList = await this.prisma.areaCommercial.findMany({
              where: { TRDAR_CD_NM: { contains: term } },
            });
          }
          if (commList.length > 0)
            return { type: 'COMMERCIAL', codes: [commList[0].TRDAR_CD] };
        }

        return null;
      };

      let result: { type: string; codes: string[] } | null = null;

      if (keywords.length >= 2) {
        const lastTwo = keywords.slice(-2).join(' ');
        result = await searchInTables(lastTwo);
      }

      if (!result) {
        const lastOne = keywords[keywords.length - 1];
        result = await searchInTables(lastOne);
      }

      if (!result && keywords.length > 2) {
        result = await searchInTables(regionCode.trim());
      }

      if (result) {
        type = result.type as 'GU' | 'DONG' | 'COMMERCIAL';
        codes = result.codes;
      } else {
        return { error: `Region not found: ${regionCode}` };
      }
    }

    const deleg = this.getDelegates(type);

    const latestRegionSales = await deleg.sales.findFirst({
      where: { [deleg.key]: { in: codes } },
      orderBy: { STDR_YYQU_CD: 'desc' },
      select: { STDR_YYQU_CD: true },
    });

    let stdrYyquCd = '';

    if (latestRegionSales) {
      stdrYyquCd = latestRegionSales.STDR_YYQU_CD;
    } else {
      return { error: 'No data available for this region' };
    }

    const [salesRaw, storeRaw, populationRaw]: [
      SalesRow[],
      StoreRow[],
      PopulationRow[],
    ] = await Promise.all([
      deleg.sales.findMany({
        where: {
          [deleg.key]: { in: codes },
          STDR_YYQU_CD: stdrYyquCd,
        },
      }),
      deleg.store.findMany({
        where: {
          [deleg.key]: { in: codes },
          STDR_YYQU_CD: stdrYyquCd,
        },
      }),
      deleg.pop.findMany({
        where: {
          [deleg.key]: { in: codes },
          STDR_YYQU_CD: stdrYyquCd,
        },
      }),
    ]);

    const availableQuarters = await deleg.sales.findMany({
      where: {
        [deleg.key]: { in: codes },
      },
      distinct: ['STDR_YYQU_CD'],
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: 4,
      select: { STDR_YYQU_CD: true },
    });

    const quartersToFetch = availableQuarters.map((q) => q.STDR_YYQU_CD).sort();

    const historyDataRaw = await deleg.sales.findMany({
      where: {
        [deleg.key]: { in: codes },
        STDR_YYQU_CD: { in: quartersToFetch },
      },
      select: {
        STDR_YYQU_CD: true,
        THSMON_SELNG_AMT: true,
      },
    });

    const historyMap = new Map<string, bigint>();
    quartersToFetch.forEach((q) => historyMap.set(q, BigInt(0)));

    historyDataRaw.forEach((row) => {
      const currentTotal = historyMap.get(row.STDR_YYQU_CD) || BigInt(0);
      historyMap.set(row.STDR_YYQU_CD, currentTotal + row.THSMON_SELNG_AMT);
    });

    const trendData = quartersToFetch.map((q) => ({
      period: q,
      sales: Number(historyMap.get(q) || BigInt(0)),
    }));

    let totalSales = BigInt(0);
    const daySales = {
      mon: BigInt(0),
      tue: BigInt(0),
      wed: BigInt(0),
      thu: BigInt(0),
      fri: BigInt(0),
      sat: BigInt(0),
      sun: BigInt(0),
    };
    const timeSales = {
      t0006: BigInt(0),
      t0611: BigInt(0),
      t1114: BigInt(0),
      t1417: BigInt(0),
      t1721: BigInt(0),
      t2124: BigInt(0),
    };
    const genderSales = { male: BigInt(0), female: BigInt(0) };
    const ageSales = {
      a10: BigInt(0),
      a20: BigInt(0),
      a30: BigInt(0),
      a40: BigInt(0),
      a50: BigInt(0),
      a60: BigInt(0),
    };

    salesRaw.forEach((row) => {
      totalSales += row.THSMON_SELNG_AMT;

      daySales.mon += row.MON_SELNG_AMT;
      daySales.tue += row.TUES_SELNG_AMT;
      daySales.wed += row.WED_SELNG_AMT;
      daySales.thu += row.THUR_SELNG_AMT;
      daySales.fri += row.FRI_SELNG_AMT;
      daySales.sat += row.SAT_SELNG_AMT;
      daySales.sun += row.SUN_SELNG_AMT;

      timeSales.t0006 += row.TMZON_00_06_SELNG_AMT;
      timeSales.t0611 += row.TMZON_06_11_SELNG_AMT;
      timeSales.t1114 += row.TMZON_11_14_SELNG_AMT;
      timeSales.t1417 += row.TMZON_14_17_SELNG_AMT;
      timeSales.t1721 += row.TMZON_17_21_SELNG_AMT;
      timeSales.t2124 += row.TMZON_21_24_SELNG_AMT;

      genderSales.male += row.ML_SELNG_AMT;
      genderSales.female += row.FML_SELNG_AMT;

      ageSales.a10 += row.AGRDE_10_SELNG_AMT;
      ageSales.a20 += row.AGRDE_20_SELNG_AMT;
      ageSales.a30 += row.AGRDE_30_SELNG_AMT;
      ageSales.a40 += row.AGRDE_40_SELNG_AMT;
      ageSales.a50 += row.AGRDE_50_SELNG_AMT;
      ageSales.a60 += row.AGRDE_60_ABOVE_SELNG_AMT;
    });

    let totalStores = 0;
    let totalOpenStores = 0;
    let totalCloseStores = 0;

    const storeCategoriesMap = new Map<
      string,
      { count: number; open: number; close: number }
    >();

    storeRaw.forEach((row) => {
      totalStores += row.STOR_CO;
      const open = row.OPBIZ_STOR_CO || 0;
      const close = row.CLSBIZ_STOR_CO || 0;

      totalOpenStores += open;
      totalCloseStores += close;

      const current = storeCategoriesMap.get(row.SVC_INDUTY_CD_NM) || {
        count: 0,
        open: 0,
        close: 0,
      };
      storeCategoriesMap.set(row.SVC_INDUTY_CD_NM, {
        count: current.count + row.STOR_CO,
        open: current.open + open,
        close: current.close + close,
      });
    });
    const storeCategories = Array.from(storeCategoriesMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        open: data.open,
        close: data.close,
      }))
      .sort((a, b) => b.count - a.count);

    let totalPopulation = 0;
    let malePopulation = 0;
    let femalePopulation = 0;
    const agePopulation = { a10: 0, a20: 0, a30: 0, a40: 0, a50: 0, a60: 0 };

    if (populationRaw && populationRaw.length > 0) {
      populationRaw.forEach((row) => {
        totalPopulation += row.TOT_REPOP_CO;
        malePopulation += row.ML_REPOP_CO;
        femalePopulation += row.FML_REPOP_CO;
        agePopulation.a10 += row.AGRDE_10_REPOP_CO;
        agePopulation.a20 += row.AGRDE_20_REPOP_CO;
        agePopulation.a30 += row.AGRDE_30_REPOP_CO;
        agePopulation.a40 += row.AGRDE_40_REPOP_CO;
        agePopulation.a50 += row.AGRDE_50_REPOP_CO;
        agePopulation.a60 += row.AGRDE_60_ABOVE_REPOP_CO;
      });
    }

    return {
      meta: {
        yearQuarter: stdrYyquCd,
        regionCode,
        matchedRegions: codes,
        type,
      },
      sales: {
        total: totalSales.toString(),
        trend: trendData,
        dayOfWeek: [
          {
            day: 'mon',
            sales: Number(daySales.mon),
            percentage: (Number(daySales.mon) / Number(totalSales || 1)) * 100,
          },
          {
            day: 'tue',
            sales: Number(daySales.tue),
            percentage: (Number(daySales.tue) / Number(totalSales || 1)) * 100,
          },
          {
            day: 'wed',
            sales: Number(daySales.wed),
            percentage: (Number(daySales.wed) / Number(totalSales || 1)) * 100,
          },
          {
            day: 'thu',
            sales: Number(daySales.thu),
            percentage: (Number(daySales.thu) / Number(totalSales || 1)) * 100,
          },
          {
            day: 'fri',
            sales: Number(daySales.fri),
            percentage: (Number(daySales.fri) / Number(totalSales || 1)) * 100,
          },
          {
            day: 'sat',
            sales: Number(daySales.sat),
            percentage: (Number(daySales.sat) / Number(totalSales || 1)) * 100,
          },
          {
            day: 'sun',
            sales: Number(daySales.sun),
            percentage: (Number(daySales.sun) / Number(totalSales || 1)) * 100,
          },
        ],
        timeOfDay: [
          {
            time: '00~06',
            sales: Number(timeSales.t0006),
            percentage:
              (Number(timeSales.t0006) / Number(totalSales || 1)) * 100,
          },
          {
            time: '06~11',
            sales: Number(timeSales.t0611),
            percentage:
              (Number(timeSales.t0611) / Number(totalSales || 1)) * 100,
          },
          {
            time: '11~14',
            sales: Number(timeSales.t1114),
            percentage:
              (Number(timeSales.t1114) / Number(totalSales || 1)) * 100,
          },
          {
            time: '14~17',
            sales: Number(timeSales.t1417),
            percentage:
              (Number(timeSales.t1417) / Number(totalSales || 1)) * 100,
          },
          {
            time: '17~21',
            sales: Number(timeSales.t1721),
            percentage:
              (Number(timeSales.t1721) / Number(totalSales || 1)) * 100,
          },
          {
            time: '21~24',
            sales: Number(timeSales.t2124),
            percentage:
              (Number(timeSales.t2124) / Number(totalSales || 1)) * 100,
          },
        ],
        gender: {
          male: Number(genderSales.male),
          female: Number(genderSales.female),
        },
        age: {
          a10: Number(ageSales.a10),
          a20: Number(ageSales.a20),
          a30: Number(ageSales.a30),
          a40: Number(ageSales.a40),
          a50: Number(ageSales.a50),
          a60: Number(ageSales.a60),
        },
      },
      store: {
        total: totalStores,
        categories: storeCategories.slice(0, 30),
        openingRate:
          totalStores > 0 ? (totalOpenStores / totalStores) * 100 : 0,
        closingRate:
          totalStores > 0 ? (totalCloseStores / totalStores) * 100 : 0,
      },
      population:
        totalPopulation > 0
          ? {
              total: totalPopulation,
              male: malePopulation,
              female: femalePopulation,
              age: agePopulation,
            }
          : null,
    };
  }

  async searchRegions(query: string) {
    if (!query) return [];

    const keywords = query.trim().split(/\s+/);

    let lastKeyword = keywords[keywords.length - 1];

    if (lastKeyword.endsWith('동') && lastKeyword.length > 2) {
      lastKeyword = lastKeyword.slice(0, -1);
    }

    const results: {
      type: string;
      code: string;
      name: string;
      fullName: string;
    }[] = [];

    const allGus = await this.prisma.areaGu.findMany();
    const guMap = new Map<string, string>();
    allGus.forEach((g) => guMap.set(g.SIGNGU_CD, g.SIGNGU_NM));

    const guMatches = await this.prisma.areaGu.findMany({
      where: { SIGNGU_NM: { contains: lastKeyword } },
    });
    guMatches.forEach((g) => {
      const cityCode = g.SIGNGU_CD.substring(0, 2);
      let cityName = '';
      if (cityCode === '11') cityName = '서울특별시';

      results.push({
        type: 'GU',
        code: g.SIGNGU_CD,
        name: g.SIGNGU_NM,
        fullName: `${cityName} ${g.SIGNGU_NM}`.trim(),
      });
    });

    const dongMatches = await this.prisma.areaDong.findMany({
      where: { ADSTRD_NM: { contains: lastKeyword } },
    });

    dongMatches.forEach((d) => {
      const guCode = d.ADSTRD_CD.slice(0, 5);
      const guName = guMap.get(guCode) || '';

      const cityCode = d.ADSTRD_CD.substring(0, 2);
      let cityName = '';
      if (cityCode === '11') cityName = '서울특별시';

      results.push({
        type: 'DONG',
        code: d.ADSTRD_CD,
        name: d.ADSTRD_NM,
        fullName: `${cityName} ${guName} ${d.ADSTRD_NM}`.trim(),
      });
    });

    const commMatches = await this.prisma.areaCommercial.findMany({
      where: { TRDAR_CD_NM: { contains: lastKeyword } },
    });
    commMatches.forEach((c) => {
      results.push({
        type: 'COMMERCIAL',
        code: c.TRDAR_CD,
        name: c.TRDAR_CD_NM,
        fullName: `${c.SIGNGU_CD_NM || ''} ${c.TRDAR_CD_NM}`.trim(),
      });
    });

    return results;
  }

  private getDelegates(type: 'GU' | 'DONG' | 'COMMERCIAL') {
    switch (type) {
      case 'GU':
        return {
          sales: this.prisma.salesGu as unknown as SalesDelegate,
          store: this.prisma.storeGu as unknown as StoreDelegate,
          pop: this.prisma.residentPopulationGu as unknown as PopDelegate,
          key: 'SIGNGU_CD',
        };
      case 'DONG':
        return {
          sales: this.prisma.salesDong as unknown as SalesDelegate,
          store: this.prisma.storeDong as unknown as StoreDelegate,
          pop: this.prisma.residentPopulationDong as unknown as PopDelegate,
          key: 'ADSTRD_CD',
        };
      case 'COMMERCIAL':
        return {
          sales: this.prisma.salesCommercial as unknown as SalesDelegate,
          store: this.prisma.storeCommercial as unknown as StoreDelegate,
          pop: this.prisma
            .residentPopulationCommercial as unknown as PopDelegate,
          key: 'TRDAR_CD',
        };
    }
  }
}

interface SalesDelegate {
  findFirst(args: unknown): Promise<{ STDR_YYQU_CD: string } | null>;
  findMany(args: unknown): Promise<SalesRow[]>;
}

interface StoreDelegate {
  findMany(args: unknown): Promise<StoreRow[]>;
}

interface PopDelegate {
  findMany(args: unknown): Promise<PopulationRow[]>;
}
