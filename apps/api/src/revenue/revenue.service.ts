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
    city: {
      codeField: 'mega_cd',
      nameField: 'mega_cd_nm',
      modelName: 'salesCity',
    },
    gu: {
      codeField: 'signgu_cd',
      nameField: 'signgu_cd_nm',
      modelName: 'salesGu',
    },
    dong: {
      codeField: 'adstrd_cd',
      nameField: 'adstrd_cd_nm',
      modelName: 'salesDong',
    },
    backarea: {
      codeField: 'trdar_cd',
      nameField: 'trdar_cd_nm',
      modelName: 'salesBackarea',
    },
    commercial: {
      codeField: 'trdar_cd',
      nameField: 'trdar_cd_nm',
      modelName: 'salesCommercial',
    },
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
      stdr_yyqu_cd: resolvedQuarter,
      [modelConfig.codeField]: code,
    };
    if (industryCode) {
      where.svc_induty_cd = industryCode;
    }

    const rows = await client.findMany({
      where,
      select: {
        stdr_yyqu_cd: true,
        svc_induty_cd: true,
        svc_induty_cd_nm: true,
        thsmon_selng_amt: true,
        thsmon_selng_co: true,
      },
    });

    if (!rows.length) {
      return {
        level,
        code,
        totalAmount: 0,
        totalCount: 0,
        items: [],
      };
    }

    const items = rows.map((row: any) => ({
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
      stdr_yyqu_cd: resolvedQuarter,
    };
    if (industryCode) {
      where.svc_induty_cd = industryCode;
    }
    if (level === 'dong' && parentGuCode) {
      where.adstrd_cd = { startsWith: parentGuCode };
    }

    const groupByArgs: any = {
      by: [modelConfig.codeField, modelConfig.nameField],
      where,
      _sum: {
        thsmon_selng_amt: true,
        thsmon_selng_co: true,
      },
      orderBy: {
        _sum: { thsmon_selng_amt: 'desc' },
      },
    };

    const rows = await client.groupBy(groupByArgs);

    const items = rows.map((row: any) => ({
      code: row[modelConfig.codeField],
      name: row[modelConfig.nameField],
      amount: Number(row._sum.thsmon_selng_amt || 0),
      count: Number(row._sum.thsmon_selng_co || 0),
      changeType: undefined as string | undefined,
    }));

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

    return {
      level,
      industryCode,
      items,
    };
  }

  private async getLatestQuarter(
    client: any,
    modelName: string,
  ): Promise<string> {
    const latest = await client.findFirst({
      select: { stdr_yyqu_cd: true },
      orderBy: { stdr_yyqu_cd: 'desc' },
    });

    if (!latest?.stdr_yyqu_cd) {
      this.logger.warn(`[${modelName}] 기준 분기 데이터가 없습니다.`);
      throw new BadRequestException('매출 데이터가 없습니다.');
    }

    return latest.stdr_yyqu_cd as string;
  }
}
