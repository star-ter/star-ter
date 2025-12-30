import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetStoreQueryDto,
  StoreLevel,
  StoreResponseDto,
} from './dto/store.dto';

type ModelConfig = {
  codeField: string;
  nameField: string;
  modelName:
    | 'storeCity'
    | 'storeGu'
    | 'storeDong'
    | 'storeBackarea'
    | 'storeCommercial';
};

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  private readonly modelMap: Record<StoreLevel, ModelConfig> = {
    city: {
      codeField: 'MEGA_CD',
      nameField: 'MEGA_CD_NM',
      modelName: 'storeCity',
    },
    gu: {
      codeField: 'SIGNGU_CD',
      nameField: 'SIGNGU_CD_NM',
      modelName: 'storeGu',
    },
    dong: {
      codeField: 'ADSTRD_CD',
      nameField: 'ADSTRD_CD_NM',
      modelName: 'storeDong',
    },
    backarea: {
      codeField: 'TRDAR_CD',
      nameField: 'TRDAR_CD_NM',
      modelName: 'storeBackarea',
    },
    commercial: {
      codeField: 'TRDAR_CD',
      nameField: 'TRDAR_CD_NM',
      modelName: 'storeCommercial',
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async getStoreStats(query: GetStoreQueryDto): Promise<StoreResponseDto> {
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
        STOR_CO: true,
        SIMILR_INDUTY_STOR_CO: true,
        FRC_STOR_CO: true,
        OPBIZ_RT: true,
        OPBIZ_STOR_CO: true,
        CLSBIZ_RT: true,
        CLSBIZ_STOR_CO: true,
      },
    });

    return {
      level,
      code,
      quarter: resolvedQuarter,
      items: rows.map((row: any) => ({
        industryCode: row.SVC_INDUTY_CD,
        industryName: row.SVC_INDUTY_CD_NM,
        storeCount: Number(row.STOR_CO || 0),
        similarStoreCount: Number(row.SIMILR_INDUTY_STOR_CO || 0),
        franchiseStoreCount: Number(row.FRC_STOR_CO || 0),
        openRate: Number(row.OPBIZ_RT || 0),
        openStoreCount: Number(row.OPBIZ_STOR_CO || 0),
        closeRate: Number(row.CLSBIZ_RT || 0),
        closeStoreCount: Number(row.CLSBIZ_STOR_CO || 0),
      })),
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
      throw new BadRequestException('점포 데이터가 없습니다.');
    }

    return latest.STDR_YYQU_CD as string;
  }
}
