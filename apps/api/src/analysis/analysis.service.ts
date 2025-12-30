import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalysisResponse,
  SalesDelegate,
  StoreDelegate,
  PopDelegate,
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

        if (endsWithDong && processTerm.length >= 2) {
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
          const commList = await this.prisma.areaCommercial.findMany({
            where: { TRDAR_CD_NM: { contains: term } },
          });
          if (commList.length > 0)
            return { type: 'COMMERCIAL', codes: [commList[0].TRDAR_CD] };
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

    if (!latestRegionSales) {
      return { error: 'No data available for this region' };
    }
    const stdrYyquCd = latestRegionSales.STDR_YYQU_CD;

    const availableQuarters = await deleg.sales.findMany({
      where: { [deleg.key]: { in: codes } },
      distinct: ['STDR_YYQU_CD'],
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: 4,
      select: { STDR_YYQU_CD: true },
    });
    const quartersToFetch = availableQuarters.map((q) => q.STDR_YYQU_CD).sort();

    if (type === 'GU') {
      return this.aggregateGu(codes, stdrYyquCd, quartersToFetch, regionCode);
    } else if (type === 'DONG') {
      return this.aggregateDong(codes, stdrYyquCd, quartersToFetch, regionCode);
    } else {
      return this.aggregateCommercial(
        codes,
        stdrYyquCd,
        quartersToFetch,
        regionCode,
      );
    }
  }

  async searchRegions(query: string) {
    if (!query) return [];

    const trimmed = query.trim();
    const results: {
      type: string;
      code: string;
      name: string;
      fullName: string;
    }[] = [];

    const allGus = await this.prisma.areaGu.findMany();
    const guMap = new Map<string, string>();
    allGus.forEach((g) => guMap.set(g.SIGNGU_CD, g.SIGNGU_NM));

    if (trimmed.endsWith('구') && trimmed.length >= 3 && trimmed.length <= 4) {
      const guMatches = await this.prisma.areaGu.findMany({
        where: { SIGNGU_NM: { contains: trimmed } },
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

      if (results.length === 0) {
        const commMatches = await this.prisma.areaCommercial.findMany({
          where: { TRDAR_CD_NM: { contains: trimmed } },
        });
        commMatches.forEach((c) => {
          results.push({
            type: 'COMMERCIAL',
            code: c.TRDAR_CD,
            name: c.TRDAR_CD_NM,
            fullName: `${c.SIGNGU_CD_NM || ''} ${c.TRDAR_CD_NM}`.trim(),
          });
        });
      }
    } else if (trimmed.endsWith('동')) {
      const dongMatches = await this.prisma.areaDong.findMany({
        where: { ADSTRD_NM: { contains: trimmed } },
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
    } else {
      const keywords = trimmed.split(/\s+/);
      const lastKeyword = keywords[keywords.length - 1];

      const dongMatches = await this.prisma.areaDong.findMany({
        where: {
          OR: [
            { ADSTRD_NM: { contains: trimmed } },
            { ADSTRD_NM: { contains: lastKeyword } },
          ],
        },
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
        where: {
          OR: [
            { TRDAR_CD_NM: { contains: trimmed } },
            { TRDAR_CD_NM: { contains: lastKeyword } },
          ],
        },
      });

      commMatches.sort((a, b) => {
        const aFull = a.TRDAR_CD_NM.includes(trimmed);
        const bFull = b.TRDAR_CD_NM.includes(trimmed);
        if (aFull && !bFull) return -1;
        if (!aFull && bFull) return 1;
        return 0;
      });

      commMatches.forEach((c) => {
        results.push({
          type: 'COMMERCIAL',
          code: c.TRDAR_CD,
          name: c.TRDAR_CD_NM,
          fullName: `${c.SIGNGU_CD_NM || ''} ${c.TRDAR_CD_NM}`.trim(),
        });
      });
    }

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

  private async aggregateGu(
    codes: string[],
    stdrYyquCd: string,
    quartersToFetch: string[],
    regionCode: string,
  ) {
    const where = { SIGNGU_CD: { in: codes }, STDR_YYQU_CD: stdrYyquCd };
    const trendWhere = {
      SIGNGU_CD: { in: codes },
      STDR_YYQU_CD: { in: quartersToFetch },
    };

    const [salesAgg, storeAgg, popAgg, storeGroups, trendGroups] =
      await Promise.all([
        this.prisma.salesGu.aggregate({
          where,
          _sum: {
            THSMON_SELNG_AMT: true,
            MON_SELNG_AMT: true,
            TUES_SELNG_AMT: true,
            WED_SELNG_AMT: true,
            THUR_SELNG_AMT: true,
            FRI_SELNG_AMT: true,
            SAT_SELNG_AMT: true,
            SUN_SELNG_AMT: true,
            TMZON_00_06_SELNG_AMT: true,
            TMZON_06_11_SELNG_AMT: true,
            TMZON_11_14_SELNG_AMT: true,
            TMZON_14_17_SELNG_AMT: true,
            TMZON_17_21_SELNG_AMT: true,
            TMZON_21_24_SELNG_AMT: true,
            ML_SELNG_AMT: true,
            FML_SELNG_AMT: true,
            AGRDE_10_SELNG_AMT: true,
            AGRDE_20_SELNG_AMT: true,
            AGRDE_30_SELNG_AMT: true,
            AGRDE_40_SELNG_AMT: true,
            AGRDE_50_SELNG_AMT: true,
            AGRDE_60_ABOVE_SELNG_AMT: true,
          },
        }),
        this.prisma.storeGu.aggregate({
          where,
          _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
        }),
        this.prisma.residentPopulationGu.aggregate({
          where,
          _sum: {
            TOT_REPOP_CO: true,
            ML_REPOP_CO: true,
            FML_REPOP_CO: true,
            AGRDE_10_REPOP_CO: true,
            AGRDE_20_REPOP_CO: true,
            AGRDE_30_REPOP_CO: true,
            AGRDE_40_REPOP_CO: true,
            AGRDE_50_REPOP_CO: true,
            AGRDE_60_ABOVE_REPOP_CO: true,
          },
        }),
        this.prisma.storeGu.groupBy({
          by: ['SVC_INDUTY_CD_NM'],
          where,
          _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
        }),
        this.prisma.salesGu.groupBy({
          by: ['STDR_YYQU_CD'],
          where: trendWhere,
          _sum: { THSMON_SELNG_AMT: true },
        }),
      ]);

    return this.mapToResponse(
      salesAgg,
      storeAgg,
      popAgg,
      storeGroups,
      trendGroups,
      regionCode,
      codes,
      'GU',
      stdrYyquCd,
      quartersToFetch,
    );
  }

  private async aggregateDong(
    codes: string[],
    stdrYyquCd: string,
    quartersToFetch: string[],
    regionCode: string,
  ) {
    const where = { ADSTRD_CD: { in: codes }, STDR_YYQU_CD: stdrYyquCd };
    const trendWhere = {
      ADSTRD_CD: { in: codes },
      STDR_YYQU_CD: { in: quartersToFetch },
    };

    const [salesAgg, storeAgg, popAgg, storeGroups, trendGroups] =
      await Promise.all([
        this.prisma.salesDong.aggregate({
          where,
          _sum: {
            THSMON_SELNG_AMT: true,
            MON_SELNG_AMT: true,
            TUES_SELNG_AMT: true,
            WED_SELNG_AMT: true,
            THUR_SELNG_AMT: true,
            FRI_SELNG_AMT: true,
            SAT_SELNG_AMT: true,
            SUN_SELNG_AMT: true,
            TMZON_00_06_SELNG_AMT: true,
            TMZON_06_11_SELNG_AMT: true,
            TMZON_11_14_SELNG_AMT: true,
            TMZON_14_17_SELNG_AMT: true,
            TMZON_17_21_SELNG_AMT: true,
            TMZON_21_24_SELNG_AMT: true,
            ML_SELNG_AMT: true,
            FML_SELNG_AMT: true,
            AGRDE_10_SELNG_AMT: true,
            AGRDE_20_SELNG_AMT: true,
            AGRDE_30_SELNG_AMT: true,
            AGRDE_40_SELNG_AMT: true,
            AGRDE_50_SELNG_AMT: true,
            AGRDE_60_ABOVE_SELNG_AMT: true,
          },
        }),
        this.prisma.storeDong.aggregate({
          where,
          _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
        }),
        this.prisma.residentPopulationDong.aggregate({
          where,
          _sum: {
            TOT_REPOP_CO: true,
            ML_REPOP_CO: true,
            FML_REPOP_CO: true,
            AGRDE_10_REPOP_CO: true,
            AGRDE_20_REPOP_CO: true,
            AGRDE_30_REPOP_CO: true,
            AGRDE_40_REPOP_CO: true,
            AGRDE_50_REPOP_CO: true,
            AGRDE_60_ABOVE_REPOP_CO: true,
          },
        }),
        this.prisma.storeDong.groupBy({
          by: ['SVC_INDUTY_CD_NM'],
          where,
          _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
        }),
        this.prisma.salesDong.groupBy({
          by: ['STDR_YYQU_CD'],
          where: trendWhere,
          _sum: { THSMON_SELNG_AMT: true },
        }),
      ]);

    return this.mapToResponse(
      salesAgg,
      storeAgg,
      popAgg,
      storeGroups,
      trendGroups,
      regionCode,
      codes,
      'DONG',
      stdrYyquCd,
      quartersToFetch,
    );
  }

  private async aggregateCommercial(
    codes: string[],
    stdrYyquCd: string,
    quartersToFetch: string[],
    regionCode: string,
  ) {
    const where = { TRDAR_CD: { in: codes }, STDR_YYQU_CD: stdrYyquCd };
    const trendWhere = {
      TRDAR_CD: { in: codes },
      STDR_YYQU_CD: { in: quartersToFetch },
    };

    const [salesAgg, storeAgg, popAgg, storeGroups, trendGroups] =
      await Promise.all([
        this.prisma.salesCommercial.aggregate({
          where,
          _sum: {
            THSMON_SELNG_AMT: true,
            MON_SELNG_AMT: true,
            TUES_SELNG_AMT: true,
            WED_SELNG_AMT: true,
            THUR_SELNG_AMT: true,
            FRI_SELNG_AMT: true,
            SAT_SELNG_AMT: true,
            SUN_SELNG_AMT: true,
            TMZON_00_06_SELNG_AMT: true,
            TMZON_06_11_SELNG_AMT: true,
            TMZON_11_14_SELNG_AMT: true,
            TMZON_14_17_SELNG_AMT: true,
            TMZON_17_21_SELNG_AMT: true,
            TMZON_21_24_SELNG_AMT: true,
            ML_SELNG_AMT: true,
            FML_SELNG_AMT: true,
            AGRDE_10_SELNG_AMT: true,
            AGRDE_20_SELNG_AMT: true,
            AGRDE_30_SELNG_AMT: true,
            AGRDE_40_SELNG_AMT: true,
            AGRDE_50_SELNG_AMT: true,
            AGRDE_60_ABOVE_SELNG_AMT: true,
          },
        }),
        this.prisma.storeCommercial.aggregate({
          where,
          _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
        }),
        this.prisma.residentPopulationCommercial.aggregate({
          where,
          _sum: {
            TOT_REPOP_CO: true,
            ML_REPOP_CO: true,
            FML_REPOP_CO: true,
            AGRDE_10_REPOP_CO: true,
            AGRDE_20_REPOP_CO: true,
            AGRDE_30_REPOP_CO: true,
            AGRDE_40_REPOP_CO: true,
            AGRDE_50_REPOP_CO: true,
            AGRDE_60_ABOVE_REPOP_CO: true,
          },
        }),
        this.prisma.storeCommercial.groupBy({
          by: ['SVC_INDUTY_CD_NM'],
          where,
          _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
        }),
        this.prisma.salesCommercial.groupBy({
          by: ['STDR_YYQU_CD'],
          where: trendWhere,
          _sum: { THSMON_SELNG_AMT: true },
        }),
      ]);

    return this.mapToResponse(
      salesAgg,
      storeAgg,
      popAgg,
      storeGroups,
      trendGroups,
      regionCode,
      codes,
      'COMMERCIAL',
      stdrYyquCd,
      quartersToFetch,
    );
  }

  private mapToResponse(
    salesAgg: { _sum: Record<string, bigint | number | null> },
    storeAgg: { _sum: Record<string, number | null> },
    popAgg: { _sum: Record<string, number | null> },
    storeGroups: {
      SVC_INDUTY_CD_NM: string;
      _sum: Record<string, number | null>;
    }[],
    trendGroups: {
      STDR_YYQU_CD: string;
      _sum: Record<string, bigint | null>;
    }[],
    regionCode: string,
    codes: string[],
    type: string,
    stdrYyquCd: string,
    quartersToFetch: string[],
  ) {
    const s = salesAgg._sum;
    const st = storeAgg._sum;
    const p = popAgg._sum;

    const totalSales = BigInt(s.THSMON_SELNG_AMT || 0);

    const trendMap = new Map<string, number>();
    trendGroups.forEach((g) => {
      trendMap.set(g.STDR_YYQU_CD, Number(g._sum.THSMON_SELNG_AMT || 0));
    });
    const trendData = quartersToFetch.map((q) => ({
      period: q,
      sales: trendMap.get(q) || 0,
    }));

    const storeCategories = storeGroups
      .map((g) => ({
        name: g.SVC_INDUTY_CD_NM,
        count: g._sum.STOR_CO || 0,
        open: g._sum.OPBIZ_STOR_CO || 0,
        close: g._sum.CLSBIZ_STOR_CO || 0,
      }))
      .sort((a, b) => b.count - a.count);

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
        dayOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(
          (day) => {
            const keyMap: Record<string, string> = {
              mon: 'MON',
              tue: 'TUES',
              wed: 'WED',
              thu: 'THUR',
              fri: 'FRI',
              sat: 'SAT',
              sun: 'SUN',
            };
            const val = Number(s[`${keyMap[day]}_SELNG_AMT`] || 0);
            return {
              day,
              sales: val,
              percentage: (val / Number(totalSales || 1)) * 100,
            };
          },
        ),
        timeOfDay: [
          { key: 'TMZON_00_06', label: '00~06' },
          { key: 'TMZON_06_11', label: '06~11' },
          { key: 'TMZON_11_14', label: '11~14' },
          { key: 'TMZON_14_17', label: '14~17' },
          { key: 'TMZON_17_21', label: '17~21' },
          { key: 'TMZON_21_24', label: '21~24' },
        ].map((t) => {
          const val = Number(s[`${t.key}_SELNG_AMT`] || 0);
          return {
            time: t.label,
            sales: val,
            percentage: (val / Number(totalSales || 1)) * 100,
          };
        }),
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
        total: st.STOR_CO || 0,
        categories: storeCategories.slice(0, 30),
        openingRate:
          (st.STOR_CO || 0) > 0
            ? ((st.OPBIZ_STOR_CO || 0) / (st.STOR_CO || 1)) * 100
            : 0,
        closingRate:
          (st.STOR_CO || 0) > 0
            ? ((st.CLSBIZ_STOR_CO || 0) / (st.STOR_CO || 1)) * 100
            : 0,
      },
      population: p.TOT_REPOP_CO
        ? {
            total: p.TOT_REPOP_CO || 0,
            male: p.ML_REPOP_CO || 0,
            female: p.FML_REPOP_CO || 0,
            age: {
              a10: p.AGRDE_10_REPOP_CO || 0,
              a20: p.AGRDE_20_REPOP_CO || 0,
              a30: p.AGRDE_30_REPOP_CO || 0,
              a40: p.AGRDE_40_REPOP_CO || 0,
              a50: p.AGRDE_50_REPOP_CO || 0,
              a60: p.AGRDE_60_ABOVE_REPOP_CO || 0,
            },
          }
        : null,
    };
  }
}
