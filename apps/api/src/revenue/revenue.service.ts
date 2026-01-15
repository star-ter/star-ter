import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueRepository } from './revenue.repository';
import {
  GetRevenueQueryDto,
  RevenueLevel,
  GetRevenueRankingQueryDto,
  RevenueRankingResponseDto,
  RevenueResponseDto,
  MarketAnalyticsResponseDto,
  AnalyticsSaturationDto,
  AverageSalesRankingResponseDto,
} from './dto/revenue.dto';
import {
  modelMap,
  RevenueRow,
  RevenueRankingRow,
  PrismaModel,
  GrowthRankingRawRow,
  AvgSalesRankingRawRow,
  RevenuePrevGroupRow,
  RevenueRankingItem,
} from './dto/service.types';

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly revenueRepository: RevenueRepository,
  ) {}

  async getRevenue(query: GetRevenueQueryDto): Promise<RevenueResponseDto> {
    const { level, code, industryCode, industryCodes, quarter } = query;
    const modelConfig = modelMap[level];
    if (!modelConfig) {
      throw new BadRequestException(`지원하지 않는 레벨: ${level}`);
    }

    const modelName = modelConfig.modelName;
    const client = (this.prisma as unknown as Record<string, PrismaModel>)[
      modelName
    ];
    if (!client) {
      throw new BadRequestException('Prisma 모델을 찾을 수 없습니다.');
    }

    const resolvedQuarter =
      quarter || (await this.getLatestQuarter(client, modelConfig.modelName));

    const where: Record<string, unknown> = {
      stdr_yyqu_cd: resolvedQuarter,
      [modelConfig.codeField]: code,
    };

    if (industryCodes) {
      where.svc_induty_cd = { in: industryCodes.split(',') };
    } else if (industryCode) {
      where.svc_induty_cd = industryCode;
    }

    const rows = (await client.findMany({
      where,
      select: {
        stdr_yyqu_cd: true,
        svc_induty_cd: true,
        svc_induty_cd_nm: true,
        thsmon_selng_amt: true,
        thsmon_selng_co: true,
      },
    })) as unknown as RevenueRow[];

    if (!rows.length) {
      return {
        level,
        code,
        totalAmount: 0,
        totalCount: 0,
        items: [],
      };
    }

    const items = rows.map((row) => ({
      industryCode: row.svc_induty_cd,
      industryName: row.svc_induty_cd_nm,
      amount: Number(row.thsmon_selng_amt || 0),
      count: Number(row.thsmon_selng_co || 0),
    }));

    const totalAmount = items.reduce((acc, cur) => acc + cur.amount, 0);
    const totalCount = items.reduce((acc, cur) => acc + cur.count, 0);

    return {
      level,
      code,
      totalAmount,
      totalCount,
      items,
    };
  }

  async getRevenueRanking(
    query: GetRevenueRankingQueryDto,
  ): Promise<RevenueRankingResponseDto> {
    const { level, industryCode, industryCodes, quarter, parentGuCode } = query;
    const modelConfig = modelMap[level];
    if (!modelConfig) {
      throw new BadRequestException(`지원하지 않는 레벨: ${level}`);
    }

    const modelName = modelConfig.modelName;
    const client = (this.prisma as unknown as Record<string, PrismaModel>)[
      modelName
    ];
    if (!client) {
      throw new BadRequestException('Prisma 모델을 찾을 수 없습니다.');
    }

    const resolvedQuarter =
      quarter || (await this.getLatestQuarter(client, modelConfig.modelName));

    const where: Record<string, unknown> = {
      stdr_yyqu_cd: resolvedQuarter,
    };

    if (industryCodes) {
      where.svc_induty_cd = { in: industryCodes.split(',') };
    } else if (industryCode) {
      where.svc_induty_cd = industryCode;
    }

    if (level === 'dong' && parentGuCode) {
      where.adstrd_cd = { startsWith: parentGuCode };
    }

    const groupByArgs = {
      by: [modelConfig.codeField, modelConfig.nameField],
      where,
      _sum: {
        thsmon_selng_amt: true,
        thsmon_selng_co: true,
      },
      orderBy: {
        _sum: { thsmon_selng_amt: 'desc' },
      },
      take: 100,
    };

    const rows = (await client.groupBy(
      groupByArgs,
    )) as unknown as RevenueRankingRow[];

    const items = rows.map((row) => ({
      code: String(row[modelConfig.codeField]),
      name: String(row[modelConfig.nameField]),
      amount: Number(row._sum.thsmon_selng_amt || 0),
      count: Number(row._sum.thsmon_selng_co || 0),
      changeType: undefined as string | undefined,
    })) as RevenueRankingItem[];

    if (level === 'gu' || level === 'dong') {
      const codes = items.map((item) => item.code);
      if (level === 'gu') {
        const baseWhere = { signgu_cd: { in: codes } };
        let changeRows = await this.prisma.commercialChangeGu.findMany({
          where: {
            stdr_yyqu_cd: resolvedQuarter,
            ...baseWhere,
          },
          select: {
            signgu_cd: true,
            trdar_chnge_ix: true,
          },
        });

        if (!changeRows.length) {
          const latestChange = await this.prisma.commercialChangeGu.findFirst({
            select: { stdr_yyqu_cd: true },
            orderBy: { stdr_yyqu_cd: 'desc' },
          });

          if (latestChange?.stdr_yyqu_cd) {
            changeRows = await this.prisma.commercialChangeGu.findMany({
              where: {
                stdr_yyqu_cd: latestChange.stdr_yyqu_cd,
                ...baseWhere,
              },
              select: {
                signgu_cd: true,
                trdar_chnge_ix: true,
              },
            });
          }
        }

        const changeMap = new Map<string, string>();
        changeRows.forEach((row) => {
          if (row.trdar_chnge_ix) {
            changeMap.set(row.signgu_cd, row.trdar_chnge_ix);
          }
        });

        items.forEach((item) => {
          item.changeType = changeMap.get(item.code);
        });
      }

      if (level === 'dong') {
        const baseWhere = { adstrd_cd: { in: codes } };
        let changeRows = await this.prisma.commercialChangeDong.findMany({
          where: {
            stdr_yyqu_cd: resolvedQuarter,
            ...baseWhere,
          },
          select: {
            adstrd_cd: true,
            trdar_chnge_ix: true,
          },
        });

        if (!changeRows.length) {
          const latestChange = await this.prisma.commercialChangeDong.findFirst(
            {
              select: { stdr_yyqu_cd: true },
              orderBy: { stdr_yyqu_cd: 'desc' },
            },
          );

          if (latestChange?.stdr_yyqu_cd) {
            changeRows = await this.prisma.commercialChangeDong.findMany({
              where: {
                stdr_yyqu_cd: latestChange.stdr_yyqu_cd,
                ...baseWhere,
              },
              select: {
                adstrd_cd: true,
                trdar_chnge_ix: true,
              },
            });
          }
        }

        const changeMap = new Map<string, string>();
        changeRows.forEach((row) => {
          if (row.trdar_chnge_ix) {
            changeMap.set(row.adstrd_cd, row.trdar_chnge_ix);
          }
        });

        items.forEach((item) => {
          item.changeType = changeMap.get(item.code);
        });
      }
    }

    // Calculate fluctuation rate and changeType for commercial level
    if (level === 'commercial') {
      const prevQ = this.getPreviousQuarter(resolvedQuarter);
      const codes = items.map((item) => item.code);

      // Fetch changeType for commercial level
      const baseWhere = { trdar_cd: { in: codes } };
      let changeRows = await this.prisma.commercialChangeCommercial.findMany({
        where: {
          stdr_yyqu_cd: resolvedQuarter,
          ...baseWhere,
        },
        select: {
          trdar_cd: true,
          trdar_chnge_ix: true,
        },
      });

      if (!changeRows.length) {
        const latestChange =
          await this.prisma.commercialChangeCommercial.findFirst({
            select: { stdr_yyqu_cd: true },
            orderBy: { stdr_yyqu_cd: 'desc' },
          });

        if (latestChange?.stdr_yyqu_cd) {
          changeRows = await this.prisma.commercialChangeCommercial.findMany({
            where: {
              stdr_yyqu_cd: latestChange.stdr_yyqu_cd,
              ...baseWhere,
            },
            select: {
              trdar_cd: true,
              trdar_chnge_ix: true,
            },
          });
        }
      }

      const changeMap = new Map<string, string>();
      changeRows.forEach((row) => {
        if (row.trdar_chnge_ix) {
          changeMap.set(row.trdar_cd, row.trdar_chnge_ix);
        }
      });

      items.forEach((item) => {
        item.changeType = changeMap.get(item.code);
      });

      const prevWhere: Record<string, unknown> = {
        stdr_yyqu_cd: prevQ,
        [modelConfig.codeField]: { in: codes },
      };

      if (industryCodes) {
        prevWhere.svc_induty_cd = { in: industryCodes.split(',') };
      } else if (industryCode) {
        prevWhere.svc_induty_cd = industryCode;
      }

      const prevGroupByArgs = {
        by: [modelConfig.codeField],
        where: prevWhere,
        _sum: { thsmon_selng_amt: true },
      };

      try {
        const prevRows = (await client.groupBy(
          prevGroupByArgs,
        )) as RevenuePrevGroupRow[];
        const prevMap = new Map<string, number>();
        prevRows.forEach((row) => {
          const codeVal = row[modelConfig.codeField] as string;
          const sumVal = row._sum?.thsmon_selng_amt;
          prevMap.set(codeVal, Number(sumVal || 0));
        });

        items.forEach((item) => {
          const prevAmount = prevMap.get(item.code) || 0;
          if (prevAmount > 0) {
            item.fluctuationRate = Number(
              (((item.amount - prevAmount) / prevAmount) * 100).toFixed(1),
            );
          }
        });
      } catch (e) {
        this.logger.warn('Failed to calculate fluctuation rate', e);
      }
    }

    return {
      level,
      industryCode,
      items,
    };
  }

  async getMarketAnalytics(
    query: GetRevenueQueryDto,
  ): Promise<MarketAnalyticsResponseDto> {
    const { level, code, quarter } = query;
    const modelConfig = modelMap[level];
    if (!modelConfig) {
      throw new BadRequestException(`지원하지 않는 레벨: ${level}`);
    }

    // 1. 분기 결정 (Repository 사용)
    const resolvedQuarter =
      quarter ||
      (await this.revenueRepository.getLatestQuarter(modelConfig.modelName));

    const whereBase: Record<string, unknown> = {
      stdr_yyqu_cd: resolvedQuarter,
      [modelConfig.codeField]: code,
    };

    // 2. 병렬 쿼리 실행 (Promise.all)
    const [
      topSectors,
      demographicsAgg,
      footTraffic,
      growth,
      topStores,
      areaData,
    ] = await Promise.all([
      this.revenueRepository.findTopSectors(modelConfig.modelName, whereBase),
      this.revenueRepository.getDemographics(modelConfig.modelName, whereBase),
      this.revenueRepository.getFootTraffic(
        modelConfig.footTrafficModelName,
        whereBase,
      ),
      this.revenueRepository.getGrowth(
        modelConfig.modelName,
        modelConfig.codeField,
        code,
      ),
      this.revenueRepository.findTopStores(
        modelConfig.storeModelName,
        whereBase,
      ),
      this.revenueRepository.getAreaSize(modelConfig.areaModelName, {
        [modelConfig.codeField]: code,
      }),
    ]);

    // 3. 결과 가공: Top Sectors (Bar Chart)
    const sectors = topSectors.map((s) => ({
      name: s.svc_induty_cd_nm,
      value: Number(s.thsmon_selng_amt || 0),
    }));

    // 4. 결과 가공: Demographics (Radar Chart)
    const dSum = demographicsAgg._sum;
    const totalMale = Number(dSum.ml_selng_amt || 0);
    const totalFemale = Number(dSum.fml_selng_amt || 0);
    const totalGender = totalMale + totalFemale || 1;
    const maleRatio = totalMale / totalGender;
    const femaleRatio = totalFemale / totalGender;

    const ageKeys = [
      { label: '10대', val: Number(dSum.agrde_10_selng_amt || 0) },
      { label: '20대', val: Number(dSum.agrde_20_selng_amt || 0) },
      { label: '30대', val: Number(dSum.agrde_30_selng_amt || 0) },
      { label: '40대', val: Number(dSum.agrde_40_selng_amt || 0) },
      { label: '50대', val: Number(dSum.agrde_50_selng_amt || 0) },
      { label: '60대', val: Number(dSum.agrde_60_above_selng_amt || 0) },
    ];

    const demographics = ageKeys.map((age) => ({
      subject: age.label,
      male: Math.round(age.val * maleRatio),
      female: Math.round(age.val * femaleRatio),
      fullMark: 0,
    }));

    const maxVal = Math.max(
      ...demographics.map((d) => Math.max(d.male, d.female)),
    );
    demographics.forEach((d) => (d.fullMark = maxVal));

    // 5. 결과 가공: Population (Line Chart)
    let population: { time: string; value: number }[] = [];
    if (footTraffic) {
      const ft = footTraffic;
      population = [
        { time: '00-06', value: Number(ft.tmzon_00_06_flpop_co || 0) },
        { time: '06-11', value: Number(ft.tmzon_06_11_flpop_co || 0) },
        { time: '11-14', value: Number(ft.tmzon_11_14_flpop_co || 0) },
        { time: '14-17', value: Number(ft.tmzon_14_17_flpop_co || 0) },
        { time: '17-21', value: Number(ft.tmzon_17_21_flpop_co || 0) },
        { time: '21-24', value: Number(ft.tmzon_21_24_flpop_co || 0) },
      ];
    }

    // 6. 결과 가공: Growth (Area Chart)
    const growthMetrics = growth
      .map((g) => ({
        period: g.stdr_yyqu_cd,
        amount: Number(g._sum.thsmon_selng_amt || 0),
      }))
      .reverse();

    // 7. 결과 가공: Saturation (밀도 계산)
    const DENSITY_THRESHOLDS = { HIGH: 0.0005, MEDIUM: 0.0002 };
    let saturation: AnalyticsSaturationDto[] = [];

    if (topStores && areaData) {
      const areaSize = Number(areaData?.relm_ar || 1);
      saturation = topStores.map((store) => {
        const count = Number(store.stor_co || 0);
        const density = count / areaSize;

        let status = '추천';
        let score = 30;
        if (density >= DENSITY_THRESHOLDS.HIGH) {
          status = '위험';
          score = 90;
        } else if (density >= DENSITY_THRESHOLDS.MEDIUM) {
          status = '경계';
          score = 60;
        }

        return { name: store.svc_induty_cd_nm, value: score, status };
      });
    }

    return {
      sectors,
      saturation,
      growth: growthMetrics,
      demographics,
      population,
    };
  }

  private async getLatestQuarter(
    client: PrismaModel,
    modelName: string,
  ): Promise<string> {
    const latest = (await client.findFirst({
      select: { stdr_yyqu_cd: true },
      orderBy: { stdr_yyqu_cd: 'desc' },
    })) as { stdr_yyqu_cd: string } | null;

    if (!latest?.stdr_yyqu_cd) {
      this.logger.warn(`[${modelName}] 기준 분기 데이터가 없습니다.`);
      throw new BadRequestException('매출 데이터가 없습니다.');
    }

    return latest.stdr_yyqu_cd;
  }

  private getPreviousQuarter(current: string): string {
    const year = parseInt(current.substring(0, 4));
    const quarter = parseInt(current.substring(4, 5));
    if (quarter === 1) return `${year - 1}4`;
    return `${year}${quarter - 1}`;
  }

  /**
   * 성장하는 상권 랭킹 - 전분기 대비 매출 증가율 기준
   */
  /**
   * 성장하는 상권 랭킹 - 전분기 대비 매출 증가율 기준
   */
  async getGrowthRanking(
    level: RevenueLevel = 'commercial',
    keyword?: string, // 검색 키워드 추가
  ): Promise<RevenueRankingResponseDto> {
    const modelConfig = modelMap[level];
    if (!modelConfig) {
      throw new BadRequestException(`Invalid level: ${level}`);
    }

    const client = (this.prisma as unknown as Record<string, PrismaModel>)[
      modelConfig.modelName
    ];
    const currentQ = await this.getLatestQuarter(client, modelConfig.modelName);
    const prevQ = this.getPreviousQuarter(currentQ);

    const codeCol = modelConfig.codeField;
    const nameCol = modelConfig.nameField;
    const table = `sales_${level}`; // sales_commercial, sales_gu, sales_dong
    const changeTable = `commercial_change_${level}`; // commercial_change_commercial etc.

    // 1. 검색 조건
    const searchCondition = keyword ? `AND ${nameCol} LIKE '%${keyword}%'` : '';
    // 2. LIMIT 조건 (검색 시 제한 없음)
    const limitCondition = keyword ? '' : 'LIMIT 100';

    const query = `
      WITH CurrentSales AS (
        SELECT 
          ${codeCol} as code,
          MAX(${nameCol}) as name,
          SUM(thsmon_selng_amt) as current_amt
        FROM ${table}
        WHERE stdr_yyqu_cd = '${currentQ}' ${searchCondition}
        GROUP BY ${codeCol}
      ),
      PrevSales AS (
        SELECT 
          ${codeCol} as code,
          SUM(thsmon_selng_amt) as prev_amt
        FROM ${table}
        WHERE stdr_yyqu_cd = '${prevQ}'
        GROUP BY ${codeCol}
      ),
      ChangeStatus AS (
        SELECT 
          ${codeCol} as code,
          MAX(trdar_chnge_ix) as change_type
        FROM ${changeTable}
        WHERE stdr_yyqu_cd = '${currentQ}'
        GROUP BY ${codeCol}
      )
      SELECT 
        c.code,
        c.name,
        c.current_amt,
        COALESCE(p.prev_amt, 0) as prev_amt,
        s.change_type,
        CASE 
          WHEN COALESCE(p.prev_amt, 0) > 0 
          THEN ( (c.current_amt - p.prev_amt)::float / p.prev_amt::float ) * 100
          ELSE 0 
        END as growth_rate
      FROM CurrentSales c
      LEFT JOIN PrevSales p ON c.code = p.code
      LEFT JOIN ChangeStatus s ON c.code = s.code
      WHERE COALESCE(p.prev_amt, 0) > 0 -- 전분기 매출이 있어야 성장률 계산 가능
      ORDER BY growth_rate DESC
      ${limitCondition};
    `;

    try {
      const results =
        await this.prisma.$queryRawUnsafe<GrowthRankingRawRow[]>(query);

      const items = results.map((row) => ({
        code: row.code,
        name: row.name,
        amount: Number(row.current_amt),
        count: 0,
        changeType: row.change_type || undefined,
        fluctuationRate: Number(row.growth_rate.toFixed(1)),
      }));

      return { level, items };
    } catch (e) {
      this.logger.error('Failed growth ranking query', e);
      return { level, items: [] };
    }
  }

  /**
   * 평균 매출 순 랭킹 - 점포당 평균 매출 기준 (상권별 총 매출 / 점포 수)
   */
  /**
   * 평균 매출 순 랭킹 - 점포당 평균 매출 기준 (상권별 총 매출 / 점포 수)
   */
  async getAverageSalesRanking(
    level: RevenueLevel = 'commercial',
    industryCode?: string,
    sortBy: 'average' | 'growth' = 'average',
    keyword?: string, // 키워드 추가
  ): Promise<AverageSalesRankingResponseDto> {
    const modelConfig = modelMap[level];
    if (!modelConfig) {
      throw new BadRequestException(`Invalid level: ${level}`);
    }

    const modelName = modelConfig.modelName;
    // 테이블명 조회 (매핑 로직 대신 직접 할당)
    const salesTable = `sales_${level}`;
    const storeTable = `store_${level}`;
    const changeTable = `commercial_change_${level}`;

    const client = (this.prisma as unknown as Record<string, PrismaModel>)[
      modelName
    ];
    const currentQ = await this.getLatestQuarter(client, modelName);
    const prevQ = this.getPreviousQuarter(currentQ);

    const codeCol = modelConfig.codeField;
    const nameCol = modelConfig.nameField;

    // 1. 조건절 생성
    const industryCondition = industryCode
      ? `AND svc_induty_cd = '${industryCode}'`
      : '';
    const searchCondition = keyword ? `AND ${nameCol} LIKE '%${keyword}%'` : '';

    const limitCondition = keyword ? '' : 'LIMIT 100';

    // 정렬 로직
    // average: 평균 매출 순
    // growth: 성장률 순
    const orderByClause =
      sortBy === 'growth' ? 'growth_rate DESC' : 'avg_sales DESC';

    const query = `
      WITH CurrentSales AS (
        SELECT 
          ${codeCol} as code,
          MAX(${nameCol}) as name,
          SUM(thsmon_selng_amt) as total_amt,
          SUM(ml_selng_amt) as male_amt,
          SUM(fml_selng_amt) as female_amt
        FROM ${salesTable}
        WHERE stdr_yyqu_cd = '${currentQ}' ${industryCondition} ${searchCondition}
        GROUP BY ${codeCol}
      ),
      CurrentStore AS (
        SELECT 
          ${codeCol} as code,
          SUM(stor_co) as store_count
        FROM ${storeTable}
        WHERE stdr_yyqu_cd = '${currentQ}' ${industryCondition}
        GROUP BY ${codeCol}
      ),
      PrevSales AS (
        SELECT 
          ${codeCol} as code,
          SUM(thsmon_selng_amt) as prev_amt
        FROM ${salesTable}
        WHERE stdr_yyqu_cd = '${prevQ}' ${industryCondition}
        GROUP BY ${codeCol}
      ),
      ChangeStatus AS (
        SELECT 
          ${codeCol} as code,
          MAX(trdar_chnge_ix) as change_type
        FROM ${changeTable}
        WHERE stdr_yyqu_cd = '${currentQ}'
        GROUP BY ${codeCol}
      )
      SELECT 
        s.code,
        s.name,
        s.total_amt,
        st.store_count,
        COALESCE(p.prev_amt, 0) as prev_amt,
        sc.change_type,
        
        -- 평균 매출 (매출 0 아님, 점포수 > 0)
        CASE 
          WHEN st.store_count > 0 THEN FLOOR(s.total_amt / st.store_count)
          ELSE 0 
        END as avg_sales,

        -- 성장률
        CASE 
          WHEN COALESCE(p.prev_amt, 0) > 0 
          THEN ( (s.total_amt - p.prev_amt)::float / p.prev_amt::float ) * 100
          ELSE 0 
        END as growth_rate,

        -- 성별 비율
        CASE 
          WHEN (s.male_amt + s.female_amt) > 0 
          THEN ROUND( (s.male_amt::float / (s.male_amt + s.female_amt)::float) * 100 )
          ELSE 0 
        END as male_ratio

      FROM CurrentSales s
      INNER JOIN CurrentStore st ON s.code = st.code -- 점포 수 정보 필수
      LEFT JOIN PrevSales p ON s.code = p.code
      LEFT JOIN ChangeStatus sc ON s.code = sc.code
      WHERE st.store_count > 0 AND s.total_amt > 0 -- 유효한 데이터만
      ORDER BY ${orderByClause}
      ${limitCondition};
    `;

    try {
      const results =
        await this.prisma.$queryRawUnsafe<AvgSalesRankingRawRow[]>(query);

      const items = results.map((row) => ({
        code: row.code,
        name: row.name,
        totalRevenue: Number(row.total_amt),
        avgSalesPerStore: Number(row.avg_sales),
        storeCount: Number(row.store_count),
        maleRatio: Number(row.male_ratio),
        femaleRatio: 100 - Number(row.male_ratio),
        changeType: row.change_type || undefined,
        fluctuationRate: Number(row.growth_rate.toFixed(1)),
      }));

      return { level, industryCode, items };
    } catch (e) {
      this.logger.error('Failed average sales ranking query', e);
      return { level, industryCode, items: [] };
    }
  }
}
