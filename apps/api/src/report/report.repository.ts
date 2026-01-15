import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly INDUSTRY_CODE_MAP: Record<string, string[]> = {
    // 음식 (I2)
    I2: [
      'CS100001',
      'CS100002',
      'CS100003',
      'CS100004',
      'CS100005',
      'CS100006',
      'CS100007',
      'CS100008',
      'CS100009',
      'CS100010',
    ],
    // 교육 (P1)
    P1: ['CS200001', 'CS200002', 'CS200003', 'CS200005'],
    // 의료·건강 (Q1)
    Q1: ['CS200006', 'CS200007', 'CS200008'],
    // 오락·스포츠 (R1)
    R1: ['CS200016', 'CS200017', 'CS200019', 'CS200024', 'CS200037'],
    // 생활서비스 (S2)
    S2: [
      'CS200025',
      'CS200026',
      'CS200028',
      'CS200029',
      'CS200030',
      'CS200031',
      'CS200032',
      'CS200033',
    ],
    // 숙박 (I1)
    I1: ['CS200034', 'CS200036'],
    // 소매 (G2)
    G2: [
      'CS300001',
      'CS300002',
      'CS300003',
      'CS300004',
      'CS300006',
      'CS300007',
      'CS300008',
      'CS300009',
      'CS300010',
      'CS300011',
      'CS300014',
      'CS300015',
      'CS300016',
      'CS300017',
      'CS300018',
      'CS300019',
      'CS300020',
      'CS300021',
      'CS300022',
      'CS300024',
      'CS300025',
      'CS300026',
      'CS300027',
      'CS300028',
      'CS300029',
      'CS300031',
      'CS300032',
      'CS300033',
      'CS300035',
      'CS300036',
      'CS300043',
    ],
  };

  async getLatestSales(regionCode: string, industryCode: string) {
    const area = await this.resolveArea(regionCode);
    if (!area) return null;

    const shouldAggregate =
      industryCode === 'ALL' || !!this.INDUSTRY_CODE_MAP[industryCode];

    if (shouldAggregate) {
      // 집계 로직
      let whereClause: any;
      if (area.type === 'dong') {
        whereClause = { adstrd_cd: area.code };
      } else if (area.type === 'commercial') {
        whereClause = { trdar_cd: area.code };
      } else {
        whereClause = { trdar_cd: area.code };
      }

      if (industryCode !== 'ALL' && this.INDUSTRY_CODE_MAP[industryCode]) {
        whereClause.svc_induty_cd = {
          in: this.INDUSTRY_CODE_MAP[industryCode],
        };
      }

      // 테이블 선택
      let model: any;
      if (area.type === 'dong') model = this.prisma.salesDong;
      else if (area.type === 'commercial') model = this.prisma.salesCommercial;
      else model = this.prisma.salesBackarea;

      // 집계
      const aggregated = await model.aggregate({
        where: whereClause,
        _sum: {
          thsmon_selng_amt: true,
          thsmon_selng_co: true,
          mdwk_selng_amt: true,
          wkend_selng_amt: true,
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
        },
      });

      const s = aggregated._sum;
      if (!s.thsmon_selng_amt) return null; // 데이터 없음

      return {
        // 집계된 데이터 반환 (필요한 필드만)
        svc_induty_cd_nm:
          industryCode === 'ALL' ? '전체 업종' : '선택 업종 합계',
        ...s,
      };
    }

    // 단일 업종 조회 (기존 로직)
    if (area.type === 'dong') {
      return this.prisma.salesDong.findFirst({
        where: { adstrd_cd: area.code, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else if (area.type === 'commercial') {
      return this.prisma.salesCommercial.findFirst({
        where: { trdar_cd: area.code, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else {
      return this.prisma.salesBackarea.findFirst({
        where: { trdar_cd: area.code, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    }
  }

  async getLatestFootTraffic(regionCode: string) {
    const area = await this.resolveArea(regionCode);
    if (!area) return null;

    if (area.type === 'dong') {
      return this.prisma.footTrafficDong.findFirst({
        where: { adstrd_cd: area.code },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else if (area.type === 'commercial') {
      return this.prisma.footTrafficCommercial.findFirst({
        where: { trdar_cd: area.code },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else {
      return this.prisma.footTrafficBackarea.findFirst({
        where: { trdar_cd: area.code },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    }
  }

  async getStoreDensity(regionCode: string, industryCode: string) {
    const area = await this.resolveArea(regionCode);
    if (!area) return null;

    const shouldAggregate =
      industryCode === 'ALL' || !!this.INDUSTRY_CODE_MAP[industryCode];

    if (shouldAggregate) {
      let whereClause: any;
      if (area.type === 'dong') {
        whereClause = { adstrd_cd: area.code };
      } else if (area.type === 'commercial') {
        whereClause = { trdar_cd: area.code };
      } else {
        whereClause = { trdar_cd: area.code };
      }

      if (industryCode !== 'ALL' && this.INDUSTRY_CODE_MAP[industryCode]) {
        whereClause.svc_induty_cd = {
          in: this.INDUSTRY_CODE_MAP[industryCode],
        };
      }

      let model: any;
      if (area.type === 'dong') model = this.prisma.storeDong;
      else if (area.type === 'commercial') model = this.prisma.storeCommercial;
      else model = this.prisma.storeBackarea;

      // 🔥 최신 분기 코드 먼저 조회
      const latestRecord = await model.findFirst({
        where: whereClause,
        orderBy: { stdr_yyqu_cd: 'desc' },
        select: { stdr_yyqu_cd: true },
      });

      if (!latestRecord) return null;

      // 🔥 최신 분기로 필터링하여 집계
      whereClause.stdr_yyqu_cd = latestRecord.stdr_yyqu_cd;

      const aggregated = await model.aggregate({
        where: whereClause,
        _sum: {
          stor_co: true,
          opbiz_stor_co: true,
          clsbiz_stor_co: true,
        },
      });

      const s = aggregated._sum;
      if (!s.stor_co) return null;

      // 개/폐업률 재계산
      // 전체 점포 수 대비 개업/폐업 수 비율 등...
      // 여기서는 단순히 합산된 개업/폐업 수와, 전체 점포 수를 반환합니다.
      // opbiz_rt (개업률) = (개업점포수 / 전체점포수) * 100
      const opbiz_rt = s.stor_co > 0 ? (s.opbiz_stor_co / s.stor_co) * 100 : 0;
      const clsbiz_rt =
        s.stor_co > 0 ? (s.clsbiz_stor_co / s.stor_co) * 100 : 0;

      return {
        stor_co: s.stor_co,
        opbiz_stor_co: s.opbiz_stor_co,
        clsbiz_stor_co: s.clsbiz_stor_co,
        opbiz_rt,
        clsbiz_rt,
      };
    }

    if (area.type === 'dong') {
      return this.prisma.storeDong.findFirst({
        where: { adstrd_cd: area.code, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else if (area.type === 'commercial') {
      return this.prisma.storeCommercial.findFirst({
        where: { trdar_cd: area.code, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else {
      return this.prisma.storeBackarea.findFirst({
        where: { trdar_cd: area.code, svc_induty_cd: industryCode },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    }
  }

  async getAreaName(regionCode: string) {
    const area = await this.resolveArea(regionCode);
    if (!area) return null;

    if (area.type === 'dong') {
      const data = await this.prisma.areaDong.findUnique({
        where: { adstrd_cd: area.code },
        select: { adstrd_nm: true },
      });
      return data ? { adstrd_nm: data.adstrd_nm } : null;
    } else if (area.type === 'commercial') {
      // 1차: areaCommercial에서 조회
      const data = await this.prisma.areaCommercial.findUnique({
        where: { trdar_cd: area.code },
        select: { trdar_cd_nm: true },
      });
      if (data) return { adstrd_nm: data.trdar_cd_nm };

      // 2차: 관광특구 등 areaCommercial에 없는 경우 salesCommercial에서 이름 조회
      const salesData = await this.prisma.salesCommercial.findFirst({
        where: { trdar_cd: area.code },
        select: { trdar_cd_nm: true },
      });
      return salesData ? { adstrd_nm: salesData.trdar_cd_nm } : null;
    } else {
      const data = await this.prisma.areaBackarea.findUnique({
        where: { alley_trdar_cd: area.code },
        select: { alley_trdar_nm: true },
      });
      return data ? { adstrd_nm: data.alley_trdar_nm } : null;
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
    const area = await this.resolveArea(regionCode);
    if (!area) return null;

    if (area.type === 'dong') {
      return this.prisma.incomeConsumptionDong.findFirst({
        where: { adstrd_cd: area.code },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else if (area.type === 'commercial') {
      return this.prisma.incomeConsumptionCommercial.findFirst({
        where: { trdar_cd: area.code },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    } else {
      return this.prisma.incomeConsumptionBackarea.findFirst({
        where: { trdar_cd: area.code },
        orderBy: { stdr_yyqu_cd: 'desc' },
      });
    }
  }

  async getTopIndustriesInArea(regionCode: string) {
    const area = await this.resolveArea(regionCode);
    if (!area) return [];

    if (area.type === 'dong') {
      return this.prisma.storeDong.findMany({
        where: { adstrd_cd: area.code },
        orderBy: [{ stdr_yyqu_cd: 'desc' }, { stor_co: 'desc' }],
        take: 10,
      });
    } else if (area.type === 'commercial') {
      return this.prisma.storeCommercial.findMany({
        where: { trdar_cd: area.code },
        orderBy: [{ stdr_yyqu_cd: 'desc' }, { stor_co: 'desc' }],
        take: 10,
      });
    } else {
      return this.prisma.storeBackarea.findMany({
        where: { trdar_cd: area.code },
        orderBy: [{ stdr_yyqu_cd: 'desc' }, { stor_co: 'desc' }],
        take: 10,
      });
    }
  }

  async getTopIndustriesBySales(regionCode: string) {
    const area = await this.resolveArea(regionCode);
    if (!area) return [];

    const orderBy = [
      { stdr_yyqu_cd: 'desc' as const },
      { thsmon_selng_amt: 'desc' as const },
    ];
    const select = {
      svc_induty_cd: true,
      svc_induty_cd_nm: true,
      thsmon_selng_amt: true,
    };

    if (area.type === 'dong') {
      return this.prisma.salesDong.findMany({
        where: { adstrd_cd: area.code },
        orderBy,
        take: 10,
        select,
      });
    } else if (area.type === 'commercial') {
      return this.prisma.salesCommercial.findMany({
        where: { trdar_cd: area.code },
        orderBy,
        take: 10,
        select,
      });
    } else {
      return this.prisma.salesBackarea.findMany({
        where: { trdar_cd: area.code },
        orderBy,
        take: 10,
        select,
      });
    }
  }

  private async resolveArea(code: string): Promise<{
    type: 'dong' | 'commercial' | 'backarea';
    code: string;
  } | null> {
    const variants = [code];
    if (code.length === 8) variants.push(code + '00');
    if (code.length === 10 && code.endsWith('00'))
      variants.push(code.substring(0, 8));

    // 1. 행정동 조회
    for (const v of variants) {
      const dong = await this.prisma.areaDong.findUnique({
        where: { adstrd_cd: v },
        select: { adstrd_cd: true },
      });
      if (dong) return { type: 'dong', code: v };
    }

    // 2. 상권 조회
    for (const v of variants) {
      const comm = await this.prisma.areaCommercial.findUnique({
        where: { trdar_cd: v },
        select: { trdar_cd: true },
      });
      if (comm) return { type: 'commercial', code: v };
    }

    // 3. 골목상권 조회
    for (const v of variants) {
      const back = await this.prisma.areaBackarea.findUnique({
        where: { alley_trdar_cd: v },
        select: { alley_trdar_cd: true },
      });
      if (back) return { type: 'backarea', code: v };
    }

    // 4. 폴백: salesCommercial에 데이터가 있는지 확인 (관광특구 등 area 테이블 누락 케이스)
    for (const v of variants) {
      const salesData = await this.prisma.salesCommercial.findFirst({
        where: { trdar_cd: v },
        select: { trdar_cd: true },
      });
      if (salesData) return { type: 'commercial', code: v };
    }

    return null;
  }

  async getAreaDetails(regionCode: string): Promise<{
    areaType: string;
    areaTypeName: string;
    guName: string;
    dongName: string;
    area: number;
  } | null> {
    const area = await this.resolveArea(regionCode);
    if (!area) return null;

    if (area.type === 'dong') {
      const dong = await this.prisma.areaDong.findUnique({
        where: { adstrd_cd: area.code },
        select: { adstrd_nm: true, relm_ar: true },
      });
      if (!dong) return null;

      // 동 이름에서 구 이름 추출 시도 (예: "강남구 역삼1동" -> "강남구")
      const parts = dong.adstrd_nm.split(' ');
      return {
        areaType: 'dong',
        areaTypeName: '행정동',
        guName: parts.length > 1 ? parts[0] : '',
        dongName: dong.adstrd_nm,
        area: dong.relm_ar || 0,
      };
    } else if (area.type === 'commercial') {
      const commercial = await this.prisma.areaCommercial.findUnique({
        where: { trdar_cd: area.code },
        select: {
          trdar_se_cd: true,
          trdar_se_cd_nm: true,
          signgu_cd_nm: true,
          adstrd_cd_nm: true,
          relm_ar: true,
        },
      });
      if (!commercial) return null;

      return {
        areaType: commercial.trdar_se_cd,
        areaTypeName: commercial.trdar_se_cd_nm,
        guName: commercial.signgu_cd_nm,
        dongName: commercial.adstrd_cd_nm,
        area: commercial.relm_ar || 0,
      };
    } else {
      // backarea
      const backarea = await this.prisma.areaBackarea.findUnique({
        where: { alley_trdar_cd: area.code },
        select: {
          signgu_cd_nm: true,
          adstrd_cd_nm: true,
          relm_ar: true,
        },
      });
      if (!backarea) return null;

      return {
        areaType: 'backarea',
        areaTypeName: '골목상권',
        guName: backarea.signgu_cd_nm,
        dongName: backarea.adstrd_cd_nm,
        area: backarea.relm_ar || 0,
      };
    }
  }
}
