import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RegionData {
  trdar_cd: string;
  // Working population
  tot_wrc_popltn_co: number;
  // Resident population
  tot_repop_co: number;
  apt_hshld_co: number;
  // Foot traffic
  tot_flpop_co: number;
  agrde_20_flpop_co: number;
  // Facility
  univ_co: number;
  subway_statn_co: number;
  viatr_fclty_co: number;
  stayng_fclty_co: number;
}

interface WorkingRow {
  trdar_cd: string;
  tot_wrc_popltn_co: number;
}
interface ResidentRow {
  trdar_cd: string;
  tot_repop_co: number;
  apt_hshld_co: number;
}
interface FootTrafficRow {
  trdar_cd: string;
  tot_flpop_co: bigint;
  agrde_20_flpop_co: bigint;
}
interface FacilityRow {
  trdar_cd: string;
  univ_co: number;
  subway_statn_co: number;
  viatr_fclty_co: number;
  stayng_fclty_co: number;
}

@Injectable()
export class PopulationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 상권별 인구/시설 데이터 조회 (SQL GROUP BY로 최적화)
   * 최신 분기 기준으로 조회
   */
  async getRegionDataByQuarter(quarter: string): Promise<RegionData[]> {
    // 4개 쿼리 병렬 실행 (SQL GROUP BY)
    const [working, resident, footTraffic, facility] = await Promise.all([
      this.prisma.$queryRaw<WorkingRow[]>`
        SELECT trdar_cd, COALESCE(SUM(tot_wrc_popltn_co), 0)::int AS tot_wrc_popltn_co
        FROM "working_population_commercial"
        WHERE stdr_yyqu_cd = ${quarter}
        GROUP BY trdar_cd
      `,
      this.prisma.$queryRaw<ResidentRow[]>`
        SELECT trdar_cd, 
          COALESCE(SUM(tot_repop_co), 0)::int AS tot_repop_co,
          COALESCE(SUM(apt_hshld_co), 0)::int AS apt_hshld_co
        FROM "resident_population_commercial"
        WHERE stdr_yyqu_cd = ${quarter}
        GROUP BY trdar_cd
      `,
      this.prisma.$queryRaw<FootTrafficRow[]>`
        SELECT trdar_cd,
          COALESCE(SUM(tot_flpop_co), 0) AS tot_flpop_co,
          COALESCE(SUM(agrde_20_flpop_co), 0) AS agrde_20_flpop_co
        FROM "foot_traffic_commercial"
        WHERE stdr_yyqu_cd = ${quarter}
        GROUP BY trdar_cd
      `,
      this.prisma.$queryRaw<FacilityRow[]>`
        SELECT trdar_cd,
          COALESCE(SUM(univ_co), 0)::int AS univ_co,
          COALESCE(SUM(subway_statn_co), 0)::int AS subway_statn_co,
          COALESCE(SUM(viatr_fclty_co), 0)::int AS viatr_fclty_co,
          COALESCE(SUM(stayng_fclty_co), 0)::int AS stayng_fclty_co
        FROM "facility_commercial"
        WHERE stdr_yyqu_cd = ${quarter}
        GROUP BY trdar_cd
      `,
    ]);

    // Map으로 변환
    const workingMap = new Map(working.map((w) => [w.trdar_cd, w]));
    const residentMap = new Map(resident.map((r) => [r.trdar_cd, r]));
    const footTrafficMap = new Map(footTraffic.map((f) => [f.trdar_cd, f]));
    const facilityMap = new Map(facility.map((f) => [f.trdar_cd, f]));

    // 모든 상권 코드 수집
    const allCodes = new Set([
      ...workingMap.keys(),
      ...residentMap.keys(),
      ...footTrafficMap.keys(),
      ...facilityMap.keys(),
    ]);

    // 결과 생성
    const result: RegionData[] = [];
    for (const code of allCodes) {
      const w = workingMap.get(code);
      const r = residentMap.get(code);
      const f = footTrafficMap.get(code);
      const fac = facilityMap.get(code);

      result.push({
        trdar_cd: code,
        tot_wrc_popltn_co: w?.tot_wrc_popltn_co ?? 0,
        tot_repop_co: r?.tot_repop_co ?? 0,
        apt_hshld_co: r?.apt_hshld_co ?? 0,
        tot_flpop_co: Number(f?.tot_flpop_co ?? 0),
        agrde_20_flpop_co: Number(f?.agrde_20_flpop_co ?? 0),
        univ_co: fac?.univ_co ?? 0,
        subway_statn_co: fac?.subway_statn_co ?? 0,
        viatr_fclty_co: fac?.viatr_fclty_co ?? 0,
        stayng_fclty_co: fac?.stayng_fclty_co ?? 0,
      });
    }

    return result;
  }
  // 서울시 전체 유동인구 최대값 조회 (절대평가 점수 산출용)
  async getGlobalMaxFootTraffic(quarter: string): Promise<number> {
    const result = await this.prisma.$queryRaw<{ max_flpop: bigint }[]>`
      SELECT MAX(sub.sum_flpop) as max_flpop
      FROM (
        SELECT SUM(tot_flpop_co) as sum_flpop
        FROM "foot_traffic_commercial"
        WHERE stdr_yyqu_cd = ${quarter}
        GROUP BY trdar_cd
      ) sub
    `;
    return Number(result[0]?.max_flpop || 2000000);
  }
}
