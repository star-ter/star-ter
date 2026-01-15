import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CommercialRentData {
  trdar_cd: string;
  trdar_cd_n: string;
  avg_deposit: number | null;
  avg_rent: number | null;
  avg_premium: number | null;
  building_count: number;
}

@Injectable()
export class RentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 모든 상권의 평균 임대료 데이터 조회
   * PostGIS를 사용해 상권 폴리곤과 부동산 정보를 공간 조인
   */
  async getAllCommercialRents(): Promise<CommercialRentData[]> {
    const result = await this.prisma.$queryRaw<CommercialRentData[]>`
      SELECT
        ca.trdar_cd,
        ca.trdar_cd_n,
        AVG(re.deposit)::float AS avg_deposit,
        AVG(re.monthlyrent)::float AS avg_rent,
        AVG(re.premium)::float AS avg_premium,
        COUNT(*)::int AS building_count
      FROM seoul_commercial_area_grid ca
      JOIN real_estate_info re
        ON ST_Contains(
             ca.geom,
             ST_SetSRID(
               ST_MakePoint(re.centerlongitude, re.centerlatitude),
               4326
             )
           )
      WHERE re.deposit IS NOT NULL
        AND re.monthlyrent IS NOT NULL
      GROUP BY ca.trdar_cd, ca.trdar_cd_n
    `;

    return result;
  }
}
