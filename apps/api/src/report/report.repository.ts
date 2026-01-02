import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestSales(regionCode: string, industryCode: string) {
    return this.prisma.salesDong.findFirst({
      where: {
        adstrd_cd: regionCode,
        svc_induty_cd: industryCode,
      },
      orderBy: {
        stdr_yyqu_cd: 'desc',
      },
    });
  }

  async getLatestFootTraffic(regionCode: string) {
    return this.prisma.footTrafficDong.findFirst({
      where: {
        adstrd_cd: regionCode,
      },
      orderBy: {
        stdr_yyqu_cd: 'desc',
      },
    });
  }

  async getStoreDensity(regionCode: string, industryCode: string) {
    const stats = await this.prisma.storeDong.findFirst({
      where: {
        adstrd_cd: regionCode,
        svc_induty_cd: industryCode,
      },
      orderBy: {
        stdr_yyqu_cd: 'desc',
      },
    });
    return stats;
  }

  async getAreaName(regionCode: string) {
    return this.prisma.areaDong.findUnique({
      where: { adstrd_cd: regionCode },
      select: { adstrd_nm: true },
    });
  }

  async getIndustryName(industryCode: string) {
    const industry = await this.prisma.service_industry.findUnique({
      where: { service_industry_cd: industryCode },
      select: { service_industry_nm: true },
    });
    return industry;
  }

  async getLatestIncome(regionCode: string) {
    return await this.prisma.incomeConsumptionDong.findFirst({
      where: { adstrd_cd: regionCode },
      orderBy: { stdr_yyqu_cd: 'desc' },
    });
  }

  async getTopIndustriesInArea(regionCode: string) {
    return await this.prisma.storeDong.findMany({
      where: { adstrd_cd: regionCode },
      orderBy: [{ stdr_yyqu_cd: 'desc' }, { stor_co: 'desc' }],
      take: 10,
    });
  }
}
