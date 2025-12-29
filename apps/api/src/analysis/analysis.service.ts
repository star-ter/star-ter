
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}

  async getAnalysis(regionCode: string) {
    // 1. Resolve Region Type and Codes
    let codes: string[] = [];
    let type: 'GU' | 'DONG' | 'COMMERCIAL' = 'COMMERCIAL';
    
    // Config for dynamic fetching
    const CONFIG = {
        GU: {
            sales: 'salesGu',
            store: 'storeGu',
            pop: 'residentPopulationGu',
            key: 'SIGNGU_CD'
        },
        DONG: {
            sales: 'salesDong',
            store: 'storeDong',
            pop: 'residentPopulationDong',
            key: 'ADSTRD_CD'
        },
        COMMERCIAL: {
            sales: 'salesCommercial',
            store: 'storeCommercial',
            pop: 'residentPopulationCommercial',
            key: 'TRDAR_CD'
        }
    };

    if (!isNaN(Number(regionCode))) {
         // Numeric: Try to match exact code in priority
         const gu = await this.prisma.areaGu.findFirst({ where: { SIGNGU_CD: regionCode } });
         if (gu) {
             type = 'GU';
             codes = [regionCode];
         } else {
             const dong = await this.prisma.areaDong.findFirst({ where: { ADSTRD_CD: regionCode } });
             if (dong) {
                 type = 'DONG';
                 codes = [regionCode];
             } else {
                 // Assume Commercial
                 type = 'COMMERCIAL';
                 codes = [regionCode];
             }
         }
    } else {
        // String: Search by Name (Priority: Gu -> Dong -> Commercial)
        // Check Gu
        const guList = await this.prisma.areaGu.findMany({
            where: { SIGNGU_NM: { contains: regionCode } }
        });
        
        if (guList.length > 0) {
            type = 'GU';
            codes = guList.map(g => g.SIGNGU_CD);
        } else {
            // Check Dong
            const dongList = await this.prisma.areaDong.findMany({
                where: { ADSTRD_NM: { contains: regionCode } }
            });
            
            if (dongList.length > 0) {
                type = 'DONG';
                codes = dongList.map(d => d.ADSTRD_CD);
            } else {
                // Check Commercial
                const commList = await this.prisma.areaCommercial.findMany({
                    where: { TRDAR_CD_NM: { contains: regionCode } }
                });
                
                if (commList.length > 0) {
                    type = 'COMMERCIAL';
                    codes = commList.map(c => c.TRDAR_CD);
                } else {
                    return { error: `Region not found: ${regionCode}` };
                }
            }
        }
    }

    const currentConfig = CONFIG[type];

    // 2. Get latest available quarter from Sales table (Use SalesCommercial as reference or dynamic?)
    // Using SalesCommercial is generally safe for system-wide latest quarter, 
    // but specific regions might not have data. Let's use the specific table just in case.
    // Dynamic Query for FindFirst
    const latestSales = await (this.prisma as any)[currentConfig.sales].findFirst({
      orderBy: { STDR_YYQU_CD: 'desc' },
      select: { STDR_YYQU_CD: true },
    });

    if (!latestSales) {
      return { error: 'No data available' };
    }

    const stdrYyquCd = latestSales.STDR_YYQU_CD;

    // 3. Fetch all raw data in parallel using dynamic table names
    const [salesRaw, storeRaw, populationRaw] = await Promise.all([
      (this.prisma as any)[currentConfig.sales].findMany({
        where: {
          [currentConfig.key]: { in: codes },
          STDR_YYQU_CD: stdrYyquCd,
        },
      }),
      (this.prisma as any)[currentConfig.store].findMany({
        where: {
          [currentConfig.key]: { in: codes },
          STDR_YYQU_CD: stdrYyquCd,
        },
      }),
      (this.prisma as any)[currentConfig.pop].findMany({
        where: {
          [currentConfig.key]: { in: codes },
          STDR_YYQU_CD: stdrYyquCd,
        },
      }),
    ]);


    // 4. Fetch History Data (Last 4 Quarters)
    // Find available quarters from the specific sales table
    const availableQuarters = await (this.prisma as any)[currentConfig.sales].findMany({
        where: {
             [currentConfig.key]: { in: codes },
        },
        distinct: ['STDR_YYQU_CD'],
        orderBy: { STDR_YYQU_CD: 'desc' },
        take: 4,
        select: { STDR_YYQU_CD: true },
    });
    
    // Sort asc to show trend over time
    const quartersToFetch = (availableQuarters as any[]).map(q => q.STDR_YYQU_CD).sort();

    // Fetch total sales for these quarters
    const historyDataRaw = await (this.prisma as any)[currentConfig.sales].findMany({
        where: {
            [currentConfig.key]: { in: codes },
            STDR_YYQU_CD: { in: quartersToFetch },
        },
        select: {
            STDR_YYQU_CD: true,
            THSMON_SELNG_AMT: true,
        },
    });

    // Aggregate by quarter
    const historyMap = new Map<string, bigint>();
    quartersToFetch.forEach(q => historyMap.set(q, BigInt(0)));

    (historyDataRaw as any[]).forEach(row => {
        const currentTotal = historyMap.get(row.STDR_YYQU_CD) || BigInt(0);
        historyMap.set(row.STDR_YYQU_CD, currentTotal + row.THSMON_SELNG_AMT);
    });

    const trendData = quartersToFetch.map(q => ({
        quarter: q,
        sales: (historyMap.get(q) || BigInt(0)).toString(),
    }));

    
    // 5. Aggregate Data (Logic remains identical as columns are consistent)
    // --- Sales Aggregation ---
    let totalSales = BigInt(0);
    const daySales = {
      mon: BigInt(0), tue: BigInt(0), wed: BigInt(0), thu: BigInt(0), fri: BigInt(0), sat: BigInt(0), sun: BigInt(0)
    };
    const timeSales = {
      t0006: BigInt(0), t0611: BigInt(0), t1114: BigInt(0), t1417: BigInt(0), t1721: BigInt(0), t2124: BigInt(0)
    };
    const genderSales = { male: BigInt(0), female: BigInt(0) };
    const ageSales = {
        a10: BigInt(0), a20: BigInt(0), a30: BigInt(0),
        a40: BigInt(0), a50: BigInt(0), a60: BigInt(0)
    };

    (salesRaw as any[]).forEach(row => {
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

    // --- Store Aggregation ---
    let totalStores = 0;
    const storeCategoriesMap = new Map<string, number>();

    (storeRaw as any[]).forEach(row => {
        totalStores += row.STOR_CO;
        // Group categories
        const currentCount = storeCategoriesMap.get(row.SVC_INDUTY_CD_NM) || 0;
        storeCategoriesMap.set(row.SVC_INDUTY_CD_NM, currentCount + row.STOR_CO);
    });

    const storeCategories = Array.from(storeCategoriesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // --- Population Aggregation ---
    let totalPopulation = 0;
    let malePopulation = 0;
    let femalePopulation = 0;
    const agePopulation = { a10: 0, a20: 0, a30: 0, a40: 0, a50: 0, a60: 0 };

    if (populationRaw && populationRaw.length > 0) {
        (populationRaw as any[]).forEach(row => {
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

    // 5. Construct Response
    return {
      meta: {
        yearQuarter: stdrYyquCd,
        regionCode,
        matchedRegions: codes,
        type, // Return type for debugging or frontend use
      },
      sales: {
        total: totalSales.toString(),
        trend: trendData,
        dayOfWeek: {
          mon: daySales.mon.toString(),
          tue: daySales.tue.toString(),
          wed: daySales.wed.toString(),
          thu: daySales.thu.toString(),
          fri: daySales.fri.toString(),
          sat: daySales.sat.toString(),
          sun: daySales.sun.toString(),
        },
        timeOfDay: {
          t0006: timeSales.t0006.toString(),
          t0611: timeSales.t0611.toString(),
          t1114: timeSales.t1114.toString(),
          t1417: timeSales.t1417.toString(),
          t1721: timeSales.t1721.toString(),
          t2124: timeSales.t2124.toString(),
        },
        gender: {
            male: genderSales.male.toString(),
            female: genderSales.female.toString(),
        },
        age: {
            a10: ageSales.a10.toString(),
            a20: ageSales.a20.toString(),
            a30: ageSales.a30.toString(),
            a40: ageSales.a40.toString(),
            a50: ageSales.a50.toString(),
            a60: ageSales.a60.toString(),
        }
      },
      store: {
        total: totalStores,
        categories: storeCategories.slice(0, 10), // Top 10
      },
      population: totalPopulation > 0 ? {
        total: totalPopulation,
        male: malePopulation,
        female: femalePopulation,
        age: agePopulation
      } : null
    };
  }
}
