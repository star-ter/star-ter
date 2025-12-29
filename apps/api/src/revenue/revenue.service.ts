import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetRevenueQueryDto,
  RevenueLevel,
  GetRevenueRankingQueryDto,
  RevenueRankingResponseDto,
  RevenueResponseDto,
} from './dto/revenue.dto';

type ModelConfig = {
  codeField: string;
  nameField: string;
  modelName:
    | 'salesCity'
    | 'salesGu'
    | 'salesDong'
    | 'salesBackarea'
    | 'salesCommercial';
};

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  private readonly modelMap: Record<RevenueLevel, ModelConfig> = {
    city: { codeField: 'MEGA_CD', nameField: 'MEGA_CD_NM', modelName: 'salesCity' },
    gu: { codeField: 'SIGNGU_CD', nameField: 'SIGNGU_CD_NM', modelName: 'salesGu' },
    dong: { codeField: 'ADSTRD_CD', nameField: 'ADSTRD_CD_NM', modelName: 'salesDong' },
    backarea: { codeField: 'TRDAR_CD', nameField: 'TRDAR_CD_NM', modelName: 'salesBackarea' },
    commercial: { codeField: 'TRDAR_CD', nameField: 'TRDAR_CD_NM', modelName: 'salesCommercial' },
  };

  constructor(private readonly prisma: PrismaService) {}

  async getRevenue(query: GetRevenueQueryDto): Promise<RevenueResponseDto> {
    const { level, code, industryCode, quarter } = query;
    const modelConfig = this.modelMap[level];
    if (!modelConfig) {
      throw new BadRequestException(`지원하지 않는 레벨: ${level}`);
    }

    const client = (this.prisma as any)[modelConfig.modelName];
    if (!client) {
      throw new BadRequestException('Prisma 모델을 찾을 수 없습니다.');
    }

    const resolvedQuarter =
      quarter || (await this.getLatestQuarter(client, modelConfig.modelName));

    const where: Record<string, string> = {
      STDR_YYQU_CD: resolvedQuarter,
      [modelConfig.codeField]: code,
    };
    if (industryCode) {
      where.SVC_INDUTY_CD = industryCode;
    }

    const rows = await client.findMany({
      where,
      select: {
        STDR_YYQU_CD: true,
        SVC_INDUTY_CD: true,
        SVC_INDUTY_CD_NM: true,
        THSMON_SELNG_AMT: true,
        THSMON_SELNG_CO: true,
      },
    });

    if (!rows.length) {
      return {
        level,
        code,
        quarter: resolvedQuarter,
        totalAmount: 0,
        totalCount: 0,
        items: [],
      };
    }

    const items = rows.map((row: any) => ({
      industryCode: row.SVC_INDUTY_CD,
      industryName: row.SVC_INDUTY_CD_NM,
      amount: Number(row.THSMON_SELNG_AMT || 0),
      count: Number(row.THSMON_SELNG_CO || 0),
    }));

    const totalAmount = items.reduce((acc, cur) => acc + cur.amount, 0);
    const totalCount = items.reduce((acc, cur) => acc + cur.count, 0);

    return {
      level,
      code,
      quarter: resolvedQuarter,
      totalAmount,
      totalCount,
      items,
    };
  }

  async getRevenueRanking(
    query: GetRevenueRankingQueryDto,
  ): Promise<RevenueRankingResponseDto> {
    const { level, industryCode, quarter, parentGuCode } = query;
    const modelConfig = this.modelMap[level];
    if (!modelConfig) {
      throw new BadRequestException(`지원하지 않는 레벨: ${level}`);
    }

    const client = (this.prisma as any)[modelConfig.modelName];
    if (!client) {
      throw new BadRequestException('Prisma 모델을 찾을 수 없습니다.');
    }

    const resolvedQuarter =
      quarter || (await this.getLatestQuarter(client, modelConfig.modelName));

    const where: Record<string, any> = {
      STDR_YYQU_CD: resolvedQuarter,
    };
    if (industryCode) {
      where.SVC_INDUTY_CD = industryCode;
    }
    if (level === 'dong' && parentGuCode) {
      where.ADSTRD_CD = { startsWith: parentGuCode };
    }

    const groupByArgs: any = {
      by: [modelConfig.codeField, modelConfig.nameField],
      where,
      _sum: {
        THSMON_SELNG_AMT: true,
        THSMON_SELNG_CO: true,
      },
      orderBy: {
        _sum: { THSMON_SELNG_AMT: 'desc' },
      },
    };

    const rows = await client.groupBy(groupByArgs);

    const items = rows.map((row: any) => ({
      code: row[modelConfig.codeField],
      name: row[modelConfig.nameField],
      amount: Number(row._sum.THSMON_SELNG_AMT || 0),
      count: Number(row._sum.THSMON_SELNG_CO || 0),
      changeType: undefined as string | undefined,
    }));

    if (level === 'gu' || level === 'dong') {
      const codes = items.map((item) => item.code);
      if (level === 'gu') {
        const baseWhere = { SIGNGU_CD: { in: codes } };
        let changeRows = await this.prisma.commercialChangeGu.findMany({
          where: {
            STDR_YYQU_CD: resolvedQuarter,
            ...baseWhere,
          },
          select: {
            SIGNGU_CD: true,
            TRDAR_CHNGE_IX: true,
          },
        });

        if (!changeRows.length) {
          const latestChange =
            await this.prisma.commercialChangeGu.findFirst({
              select: { STDR_YYQU_CD: true },
              orderBy: { STDR_YYQU_CD: 'desc' },
            });

          if (latestChange?.STDR_YYQU_CD) {
            changeRows = await this.prisma.commercialChangeGu.findMany({
              where: {
                STDR_YYQU_CD: latestChange.STDR_YYQU_CD,
                ...baseWhere,
              },
              select: {
                SIGNGU_CD: true,
                TRDAR_CHNGE_IX: true,
              },
            });
          }
        }

        const changeMap = new Map<string, string>();
        changeRows.forEach((row) => {
          if (row.TRDAR_CHNGE_IX) {
            changeMap.set(row.SIGNGU_CD, row.TRDAR_CHNGE_IX);
          }
        });

        items.forEach((item) => {
          item.changeType = changeMap.get(item.code);
        });
      }

      if (level === 'dong') {
        const baseWhere = { ADSTRD_CD: { in: codes } };
        let changeRows = await this.prisma.commercialChangeDong.findMany({
          where: {
            STDR_YYQU_CD: resolvedQuarter,
            ...baseWhere,
          },
          select: {
            ADSTRD_CD: true,
            TRDAR_CHNGE_IX: true,
          },
        });

        if (!changeRows.length) {
          const latestChange =
            await this.prisma.commercialChangeDong.findFirst({
              select: { STDR_YYQU_CD: true },
              orderBy: { STDR_YYQU_CD: 'desc' },
            });

          if (latestChange?.STDR_YYQU_CD) {
            changeRows = await this.prisma.commercialChangeDong.findMany({
              where: {
                STDR_YYQU_CD: latestChange.STDR_YYQU_CD,
                ...baseWhere,
              },
              select: {
                ADSTRD_CD: true,
                TRDAR_CHNGE_IX: true,
              },
            });
          }
        }

        const changeMap = new Map<string, string>();
        changeRows.forEach((row) => {
          if (row.TRDAR_CHNGE_IX) {
            changeMap.set(row.ADSTRD_CD, row.TRDAR_CHNGE_IX);
          }
        });

        items.forEach((item) => {
          item.changeType = changeMap.get(item.code);
        });
      }
    }

    return {
      level,
      quarter: resolvedQuarter,
      industryCode,
      items,
    };
  }

  private async getLatestQuarter(
    client: any,
    modelName: string,
  ): Promise<string> {
    const latest = await client.findFirst({
      select: { STDR_YYQU_CD: true },
      orderBy: { STDR_YYQU_CD: 'desc' },
    });

    if (!latest?.STDR_YYQU_CD) {
      this.logger.warn(`[${modelName}] 기준 분기 데이터가 없습니다.`);
      throw new BadRequestException('매출 데이터가 없습니다.');
    }

    return latest.STDR_YYQU_CD as string;
  }
}
