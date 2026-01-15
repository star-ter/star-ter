import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegionType,
  SalesAggregate,
  StoreAggregate,
  PopulationAggregate,
  WorkingPopulationAggregate,
  StoreCategoryGroup,
  SalesTrendGroup,
} from './dto/analysis.types';

const SALES_SUM_FIELDS = {
  thsmon_selng_amt: true,
  mon_selng_amt: true,
  tues_selng_amt: true,
  wed_selng_amt: true,
  thur_selng_amt: true,
  fri_selng_amt: true,
  sat_selng_amt: true,
  sun_selng_amt: true,
  tmzon_00_06_selng_amt: true,
  tmzon_06_11_selng_amt: true,
  tmzon_11_14_selng_amt: true,
  tmzon_14_17_selng_amt: true,
  tmzon_17_21_selng_amt: true,
  tmzon_21_24_selng_amt: true,
  ml_selng_amt: true,
  fml_selng_amt: true,
  agrde_10_selng_amt: true,
  agrde_20_selng_amt: true,
  agrde_30_selng_amt: true,
  agrde_40_selng_amt: true,
  agrde_50_selng_amt: true,
  agrde_60_above_selng_amt: true,
} as const;

const STORE_SUM_FIELDS = {
  stor_co: true,
  opbiz_stor_co: true,
  clsbiz_stor_co: true,
} as const;

const POPULATION_SUM_FIELDS = {
  tot_repop_co: true,
  ml_repop_co: true,
  fml_repop_co: true,
  agrde_10_repop_co: true,
  agrde_20_repop_co: true,
  agrde_30_repop_co: true,
  agrde_40_repop_co: true,
  agrde_50_repop_co: true,
  agrde_60_above_repop_co: true,
} as const;

const WORKING_POPULATION_SUM_FIELDS = {
  tot_wrc_popltn_co: true,
  ml_wrc_popltn_co: true,
  fml_wrc_popltn_co: true,
  agrde_10_wrc_popltn_co: true,
  agrde_20_wrc_popltn_co: true,
  agrde_30_wrc_popltn_co: true,
  agrde_40_wrc_popltn_co: true,
  agrde_50_wrc_popltn_co: true,
  agrde_60_above_wrc_popltn_co: true,
} as const;

@Injectable()
export class AnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGuByCode(code: string) {
    return this.prisma.areaGu.findFirst({ where: { signgu_cd: code } });
  }

  async findGuByName(name: string, exact = false) {
    if (exact) {
      return this.prisma.areaGu.findMany({ where: { signgu_nm: name } });
    }
    return this.prisma.areaGu.findMany({
      where: { signgu_nm: { contains: name } },
    });
  }

  async findDongByCode(code: string) {
    return this.prisma.areaDong.findFirst({ where: { adstrd_cd: code } });
  }

  async findDongByName(name: string, exact = false) {
    if (exact) {
      return this.prisma.areaDong.findMany({ where: { adstrd_nm: name } });
    }
    return this.prisma.areaDong.findMany({
      where: { adstrd_nm: { contains: name } },
    });
  }

  async findCommercialByCode(code: string) {
    return this.prisma.areaCommercial.findFirst({ where: { trdar_cd: code } });
  }

  async findCommercialByName(name: string, exact = false) {
    if (exact) {
      return this.prisma.areaCommercial.findMany({
        where: { trdar_cd_nm: name },
      });
    }
    return this.prisma.areaCommercial.findMany({
      where: { trdar_cd_nm: { contains: name } },
    });
  }

  async getAllGus() {
    return this.prisma.areaGu.findMany();
  }

  async getAvailableQuarters(
    type: RegionType,
    codes: string[],
    limit = 4,
  ): Promise<string[]> {
    switch (type) {
      case 'GU': {
        const results = await this.prisma.salesGu.findMany({
          where: { signgu_cd: { in: codes } },
          distinct: ['stdr_yyqu_cd'],
          orderBy: { stdr_yyqu_cd: 'desc' },
          take: limit,
          select: { stdr_yyqu_cd: true },
        });
        return results.map((q) => q.stdr_yyqu_cd).sort();
      }
      case 'DONG': {
        const results = await this.prisma.salesDong.findMany({
          where: { adstrd_cd: { in: codes } },
          distinct: ['stdr_yyqu_cd'],
          orderBy: { stdr_yyqu_cd: 'desc' },
          take: limit,
          select: { stdr_yyqu_cd: true },
        });
        return results.map((q) => q.stdr_yyqu_cd).sort();
      }
      case 'COMMERCIAL': {
        const results = await this.prisma.salesCommercial.findMany({
          where: { trdar_cd: { in: codes } },
          distinct: ['stdr_yyqu_cd'],
          orderBy: { stdr_yyqu_cd: 'desc' },
          take: limit,
          select: { stdr_yyqu_cd: true },
        });
        return results.map((q) => q.stdr_yyqu_cd).sort();
      }
    }
  }

  async aggregateSales(
    type: RegionType,
    codes: string[],
    quarter: string,
  ): Promise<SalesAggregate> {
    switch (type) {
      case 'GU':
        return (await this.prisma.salesGu.aggregate({
          where: { signgu_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: SALES_SUM_FIELDS,
        })) as unknown as SalesAggregate;
      case 'DONG':
        return (await this.prisma.salesDong.aggregate({
          where: { adstrd_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: SALES_SUM_FIELDS,
        })) as unknown as SalesAggregate;
      case 'COMMERCIAL':
        return (await this.prisma.salesCommercial.aggregate({
          where: { trdar_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: SALES_SUM_FIELDS,
        })) as unknown as SalesAggregate;
    }
  }

  async aggregateStores(
    type: RegionType,
    codes: string[],
    quarter: string,
  ): Promise<StoreAggregate> {
    switch (type) {
      case 'GU':
        return (await this.prisma.storeGu.aggregate({
          where: { signgu_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreAggregate;
      case 'DONG':
        return (await this.prisma.storeDong.aggregate({
          where: { adstrd_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreAggregate;
      case 'COMMERCIAL':
        return (await this.prisma.storeCommercial.aggregate({
          where: { trdar_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreAggregate;
    }
  }

  async aggregatePopulation(
    type: RegionType,
    codes: string[],
    quarter: string,
  ): Promise<PopulationAggregate> {
    switch (type) {
      case 'GU':
        return (await this.prisma.residentPopulationGu.aggregate({
          where: { signgu_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: POPULATION_SUM_FIELDS,
        })) as unknown as PopulationAggregate;
      case 'DONG':
        return (await this.prisma.residentPopulationDong.aggregate({
          where: { adstrd_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: POPULATION_SUM_FIELDS,
        })) as unknown as PopulationAggregate;
      case 'COMMERCIAL':
        return (await this.prisma.residentPopulationCommercial.aggregate({
          where: { trdar_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: POPULATION_SUM_FIELDS,
        })) as unknown as PopulationAggregate;
    }
  }

  async aggregateWorkingPopulation(
    type: RegionType,
    codes: string[],
    quarter: string,
  ): Promise<WorkingPopulationAggregate> {
    switch (type) {
      case 'GU':
        return (await this.prisma.workingPopulationGu.aggregate({
          where: { signgu_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: WORKING_POPULATION_SUM_FIELDS,
        })) as unknown as WorkingPopulationAggregate;
      case 'DONG':
        return (await this.prisma.workingPopulationDong.aggregate({
          where: { adstrd_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: WORKING_POPULATION_SUM_FIELDS,
        })) as unknown as WorkingPopulationAggregate;
      case 'COMMERCIAL':
        return (await this.prisma.workingPopulationCommercial.aggregate({
          where: { trdar_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: WORKING_POPULATION_SUM_FIELDS,
        })) as unknown as WorkingPopulationAggregate;
    }
  }

  async getStoreCategoryBreakdown(
    type: RegionType,
    codes: string[],
    quarter: string,
  ): Promise<StoreCategoryGroup[]> {
    switch (type) {
      case 'GU':
        return (await this.prisma.storeGu.groupBy({
          by: ['svc_induty_cd_nm'],
          where: { signgu_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreCategoryGroup[];
      case 'DONG':
        return (await this.prisma.storeDong.groupBy({
          by: ['svc_induty_cd_nm'],
          where: { adstrd_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreCategoryGroup[];
      case 'COMMERCIAL':
        return (await this.prisma.storeCommercial.groupBy({
          by: ['svc_induty_cd_nm'],
          where: { trdar_cd: { in: codes }, stdr_yyqu_cd: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreCategoryGroup[];
    }
  }

  async getSalesTrend(
    type: RegionType,
    codes: string[],
    quarters: string[],
  ): Promise<SalesTrendGroup[]> {
    switch (type) {
      case 'GU':
        return (await this.prisma.salesGu.groupBy({
          by: ['stdr_yyqu_cd'],
          where: { signgu_cd: { in: codes }, stdr_yyqu_cd: { in: quarters } },
          _sum: { thsmon_selng_amt: true },
        })) as unknown as SalesTrendGroup[];
      case 'DONG':
        return (await this.prisma.salesDong.groupBy({
          by: ['stdr_yyqu_cd'],
          where: { adstrd_cd: { in: codes }, stdr_yyqu_cd: { in: quarters } },
          _sum: { thsmon_selng_amt: true },
        })) as unknown as SalesTrendGroup[];
      case 'COMMERCIAL':
        return (await this.prisma.salesCommercial.groupBy({
          by: ['stdr_yyqu_cd'],
          where: { trdar_cd: { in: codes }, stdr_yyqu_cd: { in: quarters } },
          _sum: { thsmon_selng_amt: true },
        })) as unknown as SalesTrendGroup[];
    }
  }

  async searchIndustry(query: string) {
    return this.prisma.storeDong.findMany({
      where: {
        svc_induty_cd_nm: { contains: query },
      },
      select: {
        svc_induty_cd: true,
        svc_induty_cd_nm: true,
      },
      distinct: ['svc_induty_cd'],
      take: 20,
    });
  }

  async getIndustryName(code: string): Promise<string | null> {
    const result = await this.prisma.storeCommercial.findFirst({
      where: { svc_induty_cd: code },
      select: { svc_induty_cd_nm: true },
    });
    return result?.svc_induty_cd_nm || null;
  }

  async getSalesByIndustry(
    quarter: string,
    trdarCd: string,
    industryCd?: string,
  ): Promise<{ total_revenue: bigint; store_count: bigint }[]> {
    if (industryCd) {
      return this.prisma.$queryRaw<
        { total_revenue: bigint; store_count: bigint }[]
      >`
        SELECT 
          COALESCE(SUM(A.thsmon_selng_amt), 0)::bigint as total_revenue,
          COALESCE(SUM(B.stor_co), 0)::bigint as store_count
        FROM sales_commercial A
        LEFT JOIN store_commercial B
          ON A.trdar_cd = B.trdar_cd
          AND A.stdr_yyqu_cd = B.stdr_yyqu_cd
          AND A.svc_induty_cd = B.svc_induty_cd
        WHERE A.stdr_yyqu_cd = ${quarter}
          AND A.trdar_cd = ${trdarCd}
          AND A.svc_induty_cd = ${industryCd}
      `;
    } else {
      return this.prisma.$queryRaw<
        { total_revenue: bigint; store_count: bigint }[]
      >`
        SELECT 
          COALESCE(SUM(A.thsmon_selng_amt), 0)::bigint as total_revenue,
          COALESCE(SUM(B.stor_co), 0)::bigint as store_count
        FROM sales_commercial A
        LEFT JOIN store_commercial B
          ON A.trdar_cd = B.trdar_cd
          AND A.stdr_yyqu_cd = B.stdr_yyqu_cd
          AND A.svc_induty_cd = B.svc_induty_cd
        WHERE A.stdr_yyqu_cd = ${quarter}
          AND A.trdar_cd = ${trdarCd}
      `;
    }
  }

  async getRentData(trdarCd: string): Promise<{
    avg_deposit: number;
    avg_premium: number;
    avg_monthly_rent: number;
  } | null> {
    const result = await this.prisma.$queryRaw<
      { avg_deposit: number; avg_premium: number; avg_monthly_rent: number }[]
    >`
      SELECT
        AVG(re.deposit)::float AS avg_deposit,
        AVG(re.premium)::float AS avg_premium,
        AVG(re.monthlyrent)::float AS avg_monthly_rent
      FROM seoul_commercial_area_grid ca
      JOIN real_estate_info re
        ON ST_Contains(
             ca.geom,
             ST_SetSRID(
               ST_MakePoint(re.centerlongitude, re.centerlatitude),
               4326
             )
           )
      WHERE ca.trdar_cd = ${trdarCd}
        AND re.deposit IS NOT NULL
        AND re.monthlyrent > 0
      GROUP BY ca.trdar_cd
    `;

    return result[0] || null;
  }

  async getStoreCount(
    quarter: string,
    trdarCd: string,
    industryCd?: string,
  ): Promise<number> {
    const where: {
      stdr_yyqu_cd: string;
      trdar_cd: string;
      svc_induty_cd?: string;
    } = {
      stdr_yyqu_cd: quarter,
      trdar_cd: trdarCd,
    };

    if (industryCd) {
      where.svc_induty_cd = industryCd;
    }

    const result = await this.prisma.storeCommercial.aggregate({
      where,
      _sum: {
        stor_co: true,
      },
    });

    return result._sum.stor_co || 0;
  }

  async getRegionScoreData(quarter: string, trdarCd: string) {
    const working = await this.prisma.$queryRaw<
      { tot_wrc_popltn_co: number }[]
    >`
      SELECT COALESCE(SUM(tot_wrc_popltn_co), 0)::int AS tot_wrc_popltn_co
      FROM "working_population_commercial"
      WHERE stdr_yyqu_cd = ${quarter} AND trdar_cd = ${trdarCd}
    `;

    const resident = await this.prisma.$queryRaw<
      { tot_repop_co: number; apt_hshld_co: number }[]
    >`
      SELECT 
        COALESCE(SUM(tot_repop_co), 0)::int AS tot_repop_co,
        COALESCE(SUM(apt_hshld_co), 0)::int AS apt_hshld_co
      FROM "resident_population_commercial"
      WHERE stdr_yyqu_cd = ${quarter} AND trdar_cd = ${trdarCd}
    `;

    const footTraffic = await this.prisma.$queryRaw<
      { tot_flpop_co: bigint; agrde_20_flpop_co: bigint }[]
    >`
      SELECT 
        COALESCE(SUM(tot_flpop_co), 0) AS tot_flpop_co,
        COALESCE(SUM(agrde_20_flpop_co), 0) AS agrde_20_flpop_co
      FROM "foot_traffic_commercial"
      WHERE stdr_yyqu_cd = ${quarter} AND trdar_cd = ${trdarCd}
    `;

    const facility = await this.prisma.$queryRaw<
      {
        univ_co: number;
        subway_statn_co: number;
        viatr_fclty_co: number;
        stayng_fclty_co: number;
      }[]
    >`
      SELECT 
        COALESCE(SUM(univ_co), 0)::int AS univ_co,
        COALESCE(SUM(subway_statn_co), 0)::int AS subway_statn_co,
        COALESCE(SUM(viatr_fclty_co), 0)::int AS viatr_fclty_co,
        COALESCE(SUM(stayng_fclty_co), 0)::int AS stayng_fclty_co
      FROM "facility_commercial"
      WHERE stdr_yyqu_cd = ${quarter} AND trdar_cd = ${trdarCd}
    `;

    return {
      trdar_cd: trdarCd,
      tot_wrc_popltn_co: working[0]?.tot_wrc_popltn_co || 0,
      tot_repop_co: resident[0]?.tot_repop_co || 0,
      apt_hshld_co: resident[0]?.apt_hshld_co || 0,
      tot_flpop_co: Number(footTraffic[0]?.tot_flpop_co || 0),
      agrde_20_flpop_co: Number(footTraffic[0]?.agrde_20_flpop_co || 0),
      univ_co: facility[0]?.univ_co || 0,
      subway_statn_co: facility[0]?.subway_statn_co || 0,
      viatr_fclty_co: facility[0]?.viatr_fclty_co || 0,
      stayng_fclty_co: facility[0]?.stayng_fclty_co || 0,
    };
  }

  async getScoringBenchmarks(quarter: string, industryCode?: string) {
    const maxFootTrafficResult = await this.prisma.$queryRaw<
      { max_flpop: bigint }[]
    >`
      SELECT MAX(sub.sum_flpop) as max_flpop
      FROM (
        SELECT SUM(tot_flpop_co) as sum_flpop
        FROM "foot_traffic_commercial"
        WHERE stdr_yyqu_cd = ${quarter}
        GROUP BY trdar_cd
      ) sub
    `;
    const maxFootTraffic = Number(
      maxFootTrafficResult[0]?.max_flpop || 2000000,
    );

    // 2. Industry Averages (for Industry Score)
    let avgIndustrySales = 0;
    let avgDensity = 0;

    if (industryCode) {
      // Avg Sales
      // List page calculates AVG of SUM(sales) grouped by trdar_cd
      const avgSalesResult = await this.prisma.$queryRaw<
        { avg_sales: number }[]
      >`
        SELECT AVG(sub.sum_sales)::float as avg_sales
        FROM (
          SELECT SUM(thsmon_selng_amt) as sum_sales
          FROM "sales_commercial"
          WHERE stdr_yyqu_cd = ${quarter} AND svc_induty_cd = ${industryCode}
          GROUP BY trdar_cd
        ) sub
      `;
      avgIndustrySales = avgSalesResult[0]?.avg_sales || 0;

      // Avg Density
      // List page calculates AVG of (SUM(stores) / area) grouped by trdar_cd
      const avgDensityResult = await this.prisma.$queryRaw<
        { avg_density: number }[]
      >`
        SELECT AVG(sub.density)::float as avg_density
        FROM (
          SELECT 
            (SUM(s.stor_co)::float / GREATEST(COALESCE(AVG(a.relm_ar), 1), 1)) as density
          FROM "store_commercial" s
          LEFT JOIN "seoul_commercial_area_grid" a ON s.trdar_cd = a.trdar_cd
          WHERE s.stdr_yyqu_cd = ${quarter} AND s.svc_induty_cd = ${industryCode}
          GROUP BY s.trdar_cd
        ) sub
      `;
      avgDensity = avgDensityResult[0]?.avg_density || 0;
    }

    return {
      maxFootTraffic,
      avgIndustrySales,
      avgDensity,
    };
  }
  async getAreaSize(trdarCd: string): Promise<number> {
    const result = await this.prisma.areaCommercial.findFirst({
      where: { trdar_cd: trdarCd },
      select: { relm_ar: true },
    });
    return Number(result?.relm_ar || 1);
  }
}
