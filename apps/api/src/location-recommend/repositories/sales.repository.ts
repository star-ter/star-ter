import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AggregatedSalesData {
  trdar_cd: string;
  trdar_cd_nm: string;
  thsmon_selng_amt: bigint;
  agrde_10_selng_amt: bigint;
  agrde_20_selng_amt: bigint;
  agrde_30_selng_amt: bigint;
  agrde_40_selng_amt: bigint;
  agrde_50_selng_amt: bigint;
  agrde_60_above_selng_amt: bigint;
  tmzon_00_06_selng_amt: bigint;
  tmzon_06_11_selng_amt: bigint;
  tmzon_11_14_selng_amt: bigint;
  tmzon_14_17_selng_amt: bigint;
  tmzon_17_21_selng_amt: bigint;
  tmzon_21_24_selng_amt: bigint;
}

@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 상권별 매출 데이터 집계 (전체 업종 합산)
   * SQL GROUP BY로 DB에서 집계하여 성능 최적화
   */
  async getAggregatedSalesByQuarter(
    quarter: string,
  ): Promise<AggregatedSalesData[]> {
    const result = await this.prisma.$queryRaw<AggregatedSalesData[]>`
      SELECT
        trdar_cd,
        MAX(trdar_cd_nm) AS trdar_cd_nm,
        COALESCE(SUM(thsmon_selng_amt), 0) AS thsmon_selng_amt,
        COALESCE(SUM(agrde_10_selng_amt), 0) AS agrde_10_selng_amt,
        COALESCE(SUM(agrde_20_selng_amt), 0) AS agrde_20_selng_amt,
        COALESCE(SUM(agrde_30_selng_amt), 0) AS agrde_30_selng_amt,
        COALESCE(SUM(agrde_40_selng_amt), 0) AS agrde_40_selng_amt,
        COALESCE(SUM(agrde_50_selng_amt), 0) AS agrde_50_selng_amt,
        COALESCE(SUM(agrde_60_above_selng_amt), 0) AS agrde_60_above_selng_amt,
        COALESCE(SUM(tmzon_00_06_selng_amt), 0) AS tmzon_00_06_selng_amt,
        COALESCE(SUM(tmzon_06_11_selng_amt), 0) AS tmzon_06_11_selng_amt,
        COALESCE(SUM(tmzon_11_14_selng_amt), 0) AS tmzon_11_14_selng_amt,
        COALESCE(SUM(tmzon_14_17_selng_amt), 0) AS tmzon_14_17_selng_amt,
        COALESCE(SUM(tmzon_17_21_selng_amt), 0) AS tmzon_17_21_selng_amt,
        COALESCE(SUM(tmzon_21_24_selng_amt), 0) AS tmzon_21_24_selng_amt
      FROM sales_commercial
      WHERE stdr_yyqu_cd = ${quarter}
      GROUP BY trdar_cd
    `;

    return result;
  }

  /**
   * 상권별 특정 업종 매출 조회
   * @param quarter 분기 코드
   * @param industryCode 업종 코드 (예: CS100010)
   * @returns Map<상권코드, 업종매출>
   */
  async getIndustrySalesByQuarter(
    quarter: string,
    industryCode: string,
  ): Promise<{ salesMap: Map<string, number>; avgIndustrySales: number }> {
    const result = await this.prisma.$queryRaw<
      { trdar_cd: string; industry_sales: bigint }[]
    >`
      SELECT
        trdar_cd,
        COALESCE(SUM(thsmon_selng_amt), 0) AS industry_sales
      FROM sales_commercial
      WHERE stdr_yyqu_cd = ${quarter}
        AND svc_induty_cd = ${industryCode}
      GROUP BY trdar_cd
    `;

    // Map 생성 및 평균 계산
    const salesMap = new Map<string, number>();
    let totalIndustrySales = 0;

    result.forEach((row) => {
      const sales = Number(row.industry_sales);
      salesMap.set(row.trdar_cd, sales);
      totalIndustrySales += sales;
    });

    const avgIndustrySales =
      result.length > 0 ? totalIndustrySales / result.length : 0;

    return { salesMap, avgIndustrySales };
  }

  /**
   * 상권별 특정 업종 점포 수 및 면적 조회 (밀도 계산용)
   * @param quarter 분기 코드
   * @param industryCode 업종 코드
   * @returns Map<상권코드, {storeCount, areaSize, density}>
   */
  async getIndustryDensityByQuarter(
    quarter: string,
    industryCode: string,
  ): Promise<{
    densityMap: Map<
      string,
      { storeCount: number; areaSize: number; density: number }
    >;
    avgDensity: number;
  }> {
    // 점포 수 조회
    const storeResult = await this.prisma.$queryRaw<
      { trdar_cd: string; store_count: bigint }[]
    >`
      SELECT
        trdar_cd,
        COALESCE(SUM(stor_co), 0) AS store_count
      FROM store_commercial
      WHERE stdr_yyqu_cd = ${quarter}
        AND svc_induty_cd = ${industryCode}
      GROUP BY trdar_cd
    `;

    // 면적 조회
    const areaResult = await this.prisma.$queryRaw<
      { trdar_cd: string; relm_ar: number }[]
    >`
      SELECT trdar_cd, relm_ar
      FROM seoul_commercial_area_grid
    `;

    // Map 생성
    const areaMap = new Map<string, number>();
    areaResult.forEach((row) => {
      areaMap.set(row.trdar_cd, Number(row.relm_ar) || 1);
    });

    const densityMap = new Map<
      string,
      { storeCount: number; areaSize: number; density: number }
    >();
    let totalDensity = 0;

    storeResult.forEach((row) => {
      const storeCount = Number(row.store_count);
      const areaSize = areaMap.get(row.trdar_cd) || 1;
      const density = storeCount / areaSize;

      densityMap.set(row.trdar_cd, { storeCount, areaSize, density });
      totalDensity += density;
    });

    const avgDensity =
      storeResult.length > 0 ? totalDensity / storeResult.length : 0;

    return { densityMap, avgDensity };
  }
  // 서울시 전체 업종별 평균 매출 및 밀도 조회 (절대평가 점수 산출)
  async getGlobalIndustryBenchmarks(
    quarter: string,
    industryCode: string,
  ): Promise<{ avgIndustrySales: number; avgDensity: number }> {
    const avgSalesResult = await this.prisma.$queryRaw<{ avg_sales: number }[]>`
      SELECT AVG(sub.sum_sales)::float as avg_sales
      FROM (
        SELECT SUM(thsmon_selng_amt) as sum_sales
        FROM "sales_commercial"
        WHERE stdr_yyqu_cd = ${quarter} AND svc_induty_cd = ${industryCode}
        GROUP BY trdar_cd
      ) sub
    `;
    const avgIndustrySales = avgSalesResult[0]?.avg_sales || 0;
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
    const avgDensity = avgDensityResult[0]?.avg_density || 0;

    return { avgIndustrySales, avgDensity };
  }
}
