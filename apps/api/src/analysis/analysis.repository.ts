import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegionType,
  SalesAggregate,
  StoreAggregate,
  PopulationAggregate,
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
}
