import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestSales(regionCode: string, industryCode: string) {
    const type = await this.getAreaType(regionCode);
    if (type === 'dong') {
      return this.prisma.salesDong.findFirst({
        where: { adstrd_cd: regionCode, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else if (type === 'commercial') {
      return this.prisma.salesCommercial.findFirst({
        where: { trdar_cd: regionCode, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else {
      return this.prisma.salesBackarea.findFirst({
        where: { trdar_cd: regionCode, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    }
  }

  async getLatestFootTraffic(regionCode: string) {
    const type = await this.getAreaType(regionCode);
    if (type === 'dong') {
      return this.prisma.footTrafficDong.findFirst({
        where: { adstrd_cd: regionCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else if (type === 'commercial') {
      return this.prisma.footTrafficCommercial.findFirst({
        where: { trdar_cd: regionCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else {
      return this.prisma.footTrafficBackarea.findFirst({
        where: { trdar_cd: regionCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    }
  }

  async getStoreDensity(regionCode: string, industryCode: string) {
    const type = await this.getAreaType(regionCode);
    if (type === 'dong') {
      return this.prisma.storeDong.findFirst({
        where: { adstrd_cd: regionCode, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else if (type === 'commercial') {
      return this.prisma.storeCommercial.findFirst({
        where: { trdar_cd: regionCode, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else {
      return this.prisma.storeBackarea.findFirst({
        where: { trdar_cd: regionCode, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    }
  }

  async getAreaName(regionCode: string) {
    const type = await this.getAreaType(regionCode);
    if (type === 'dong') {
      const area = await this.prisma.areaDong.findUnique({
        where: { adstrd_cd: regionCode },
        select: { adstrd_nm: true },
      });
      return area ? { adstrd_nm: area.adstrd_nm } : null;
    } else if (type === 'commercial') {
      const area = await this.prisma.areaCommercial.findUnique({
        where: { trdar_cd: regionCode },
        select: { trdar_cd_nm: true },
      });
      return area ? { adstrd_nm: area.trdar_cd_nm } : null;
    } else {
      const area = await this.prisma.areaBackarea.findUnique({
        where: { alley_trdar_cd: regionCode },
        select: { alley_trdar_nm: true },
      });
      return area ? { adstrd_nm: area.alley_trdar_nm } : null;
    }
  }

  async getIndustryName(industryCode: string) {
    const industry = await this.prisma.service_industry.findUnique({
      where: { service_industry_cd: industryCode },
      select: { service_industry_nm: true },
    });
    return industry;
  }

  async getLatestIncome(regionCode: string) {
    const type = await this.getAreaType(regionCode);
    if (type === 'dong') {
      return this.prisma.incomeConsumptionDong.findFirst({
        where: { adstrd_cd: regionCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else if (type === 'commercial') {
      return this.prisma.incomeConsumptionCommercial.findFirst({
        where: { trdar_cd: regionCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else {
      return this.prisma.incomeConsumptionBackarea.findFirst({
        where: { trdar_cd: regionCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    }
  }

  async getTopIndustriesInArea(regionCode: string) {
    const type = await this.getAreaType(regionCode);
    if (type === 'dong') {
      return this.prisma.storeDong.findMany({
        where: { adstrd_cd: regionCode },
        orderBy: [{ stdr_yyqu_cd: 'desc' }, { stor_co: 'desc' }],
        take: 10,
      });
    } else if (type === 'commercial') {
      return this.prisma.storeCommercial.findMany({
        where: { trdar_cd: regionCode },
        orderBy: [{ stdr_yyqu_cd: 'desc' }, { stor_co: 'desc' }],
        take: 10,
      });
    } else {
      return this.prisma.storeBackarea.findMany({
        where: { trdar_cd: regionCode },
        orderBy: [{ stdr_yyqu_cd: 'desc' }, { stor_co: 'desc' }],
        take: 10,
      });
    }
  }

  private async getAreaType(
    code: string,
  ): Promise<'dong' | 'commercial' | 'backarea'> {
    // 행정동 테이블에서 먼저 조회 (8자리 코드 대응)
    const dong = await this.prisma.areaDong.findUnique({
      where: { adstrd_cd: code },
      select: { adstrd_cd: true },
    });
    if (dong) return 'dong';

    // 상권 테이블 조회
    const comm = await this.prisma.areaCommercial.findUnique({
      where: { trdar_cd: code },
      select: { trdar_cd: true },
    });
    if (comm) return 'commercial';

    return 'backarea';
  }
}
