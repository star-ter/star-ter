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
} as const;

const STORE_SUM_FIELDS = {
  STOR_CO: true,
  OPBIZ_STOR_CO: true,
  CLSBIZ_STOR_CO: true,
} as const;

const POPULATION_SUM_FIELDS = {
  TOT_REPOP_CO: true,
  ML_REPOP_CO: true,
  FML_REPOP_CO: true,
  AGRDE_10_REPOP_CO: true,
  AGRDE_20_REPOP_CO: true,
  AGRDE_30_REPOP_CO: true,
  AGRDE_40_REPOP_CO: true,
  AGRDE_50_REPOP_CO: true,
  AGRDE_60_ABOVE_REPOP_CO: true,
} as const;

@Injectable()
export class AnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGuByCode(code: string) {
    return this.prisma.areaGu.findFirst({ where: { SIGNGU_CD: code } });
  }

  async findGuByName(name: string, exact = false) {
    if (exact) {
      return this.prisma.areaGu.findMany({ where: { SIGNGU_NM: name } });
    }
    return this.prisma.areaGu.findMany({
      where: { SIGNGU_NM: { contains: name } },
    });
  }

  async findDongByCode(code: string) {
    return this.prisma.areaDong.findFirst({ where: { ADSTRD_CD: code } });
  }

  async findDongByName(name: string, exact = false) {
    if (exact) {
      return this.prisma.areaDong.findMany({ where: { ADSTRD_NM: name } });
    }
    return this.prisma.areaDong.findMany({
      where: { ADSTRD_NM: { contains: name } },
    });
  }

  async findCommercialByCode(code: string) {
    return this.prisma.areaCommercial.findFirst({ where: { TRDAR_CD: code } });
  }

  async findCommercialByName(name: string, exact = false) {
    if (exact) {
      return this.prisma.areaCommercial.findMany({
        where: { TRDAR_CD_NM: name },
      });
    }
    return this.prisma.areaCommercial.findMany({
      where: { TRDAR_CD_NM: { contains: name } },
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
          where: { SIGNGU_CD: { in: codes } },
          distinct: ['STDR_YYQU_CD'],
          orderBy: { STDR_YYQU_CD: 'desc' },
          take: limit,
          select: { STDR_YYQU_CD: true },
        });
        return results.map((q) => q.STDR_YYQU_CD).sort();
      }
      case 'DONG': {
        const results = await this.prisma.salesDong.findMany({
          where: { ADSTRD_CD: { in: codes } },
          distinct: ['STDR_YYQU_CD'],
          orderBy: { STDR_YYQU_CD: 'desc' },
          take: limit,
          select: { STDR_YYQU_CD: true },
        });
        return results.map((q) => q.STDR_YYQU_CD).sort();
      }
      case 'COMMERCIAL': {
        const results = await this.prisma.salesCommercial.findMany({
          where: { TRDAR_CD: { in: codes } },
          distinct: ['STDR_YYQU_CD'],
          orderBy: { STDR_YYQU_CD: 'desc' },
          take: limit,
          select: { STDR_YYQU_CD: true },
        });
        return results.map((q) => q.STDR_YYQU_CD).sort();
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
          where: { SIGNGU_CD: { in: codes }, STDR_YYQU_CD: quarter },
          _sum: SALES_SUM_FIELDS,
        })) as unknown as SalesAggregate;
      case 'DONG':
        return (await this.prisma.salesDong.aggregate({
          where: { ADSTRD_CD: { in: codes }, STDR_YYQU_CD: quarter },
          _sum: SALES_SUM_FIELDS,
        })) as unknown as SalesAggregate;
      case 'COMMERCIAL':
        return (await this.prisma.salesCommercial.aggregate({
          where: { TRDAR_CD: { in: codes }, STDR_YYQU_CD: quarter },
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
          where: { SIGNGU_CD: { in: codes }, STDR_YYQU_CD: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreAggregate;
      case 'DONG':
        return (await this.prisma.storeDong.aggregate({
          where: { ADSTRD_CD: { in: codes }, STDR_YYQU_CD: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreAggregate;
      case 'COMMERCIAL':
        return (await this.prisma.storeCommercial.aggregate({
          where: { TRDAR_CD: { in: codes }, STDR_YYQU_CD: quarter },
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
          where: { SIGNGU_CD: { in: codes }, STDR_YYQU_CD: quarter },
          _sum: POPULATION_SUM_FIELDS,
        })) as unknown as PopulationAggregate;
      case 'DONG':
        return (await this.prisma.residentPopulationDong.aggregate({
          where: { ADSTRD_CD: { in: codes }, STDR_YYQU_CD: quarter },
          _sum: POPULATION_SUM_FIELDS,
        })) as unknown as PopulationAggregate;
      case 'COMMERCIAL':
        return (await this.prisma.residentPopulationCommercial.aggregate({
          where: { TRDAR_CD: { in: codes }, STDR_YYQU_CD: quarter },
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
          by: ['SVC_INDUTY_CD_NM'],
          where: { SIGNGU_CD: { in: codes }, STDR_YYQU_CD: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreCategoryGroup[];
      case 'DONG':
        return (await this.prisma.storeDong.groupBy({
          by: ['SVC_INDUTY_CD_NM'],
          where: { ADSTRD_CD: { in: codes }, STDR_YYQU_CD: quarter },
          _sum: STORE_SUM_FIELDS,
        })) as unknown as StoreCategoryGroup[];
      case 'COMMERCIAL':
        return (await this.prisma.storeCommercial.groupBy({
          by: ['SVC_INDUTY_CD_NM'],
          where: { TRDAR_CD: { in: codes }, STDR_YYQU_CD: quarter },
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
          by: ['STDR_YYQU_CD'],
          where: { SIGNGU_CD: { in: codes }, STDR_YYQU_CD: { in: quarters } },
          _sum: { THSMON_SELNG_AMT: true },
        })) as unknown as SalesTrendGroup[];
      case 'DONG':
        return (await this.prisma.salesDong.groupBy({
          by: ['STDR_YYQU_CD'],
          where: { ADSTRD_CD: { in: codes }, STDR_YYQU_CD: { in: quarters } },
          _sum: { THSMON_SELNG_AMT: true },
        })) as unknown as SalesTrendGroup[];
      case 'COMMERCIAL':
        return (await this.prisma.salesCommercial.groupBy({
          by: ['STDR_YYQU_CD'],
          where: { TRDAR_CD: { in: codes }, STDR_YYQU_CD: { in: quarters } },
          _sum: { THSMON_SELNG_AMT: true },
        })) as unknown as SalesTrendGroup[];
    }
  }
}
