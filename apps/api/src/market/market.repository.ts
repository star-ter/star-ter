import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AdministrativeAreaResult,
  CommercialAreaResult,
} from './dto/market.interface';
import { SalesCommercial, SalesDong } from 'generated/prisma/client';

@Injectable()
export class MarketRepository {
  constructor(private readonly prisma: PrismaService) {}

  // PostGIS: 상권 영역 찾기
  async findCommercialArea(
    lat: number,
    lng: number,
  ): Promise<CommercialAreaResult | null> {
    const result = await this.prisma.$queryRaw<CommercialAreaResult[]>`
      SELECT TRDAR_CD as "TRDAR_CD", TRDAR_CD_N as "TRDAR_CD_NM", TRDAR_SE_1 as "TRDAR_SE_1"
      FROM seoul_commercial_area_grid
      WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326))
      LIMIT 1
    `;
    return result[0] || null;
  }

  // PostGIS: 행정동 영역 찾기
  async findAdministrativeDistrict(
    lat: number,
    lng: number,
  ): Promise<AdministrativeAreaResult | null> {
    const result = await this.prisma.$queryRaw<AdministrativeAreaResult[]>`
      SELECT adm_cd::text as "ADSTRD_CD", adm_nm as "ADSTRD_NM"
      FROM admin_area_dong
      WHERE ST_Intersects(
        ST_SetSRID(
          ST_GeomFromGeoJSON(
            jsonb_build_object(
              'type',
              CASE WHEN jsonb_typeof(polygons #> '{0,0,0}') = 'number' THEN 'Polygon' ELSE 'MultiPolygon' END,
              'coordinates',
              polygons
            )
          ),
          4326
        ),
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
      )
      LIMIT 1
    `;
    return result[0] || null;
  }

  // 상권 매출 데이터 조회
  async getCommercialSales(
    code: string,
    limit: number = 5,
  ): Promise<SalesCommercial[]> {
    return this.prisma.salesCommercial.findMany({
      where: { TRDAR_CD: code },
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: limit,
    });
  }

  // 행정동 매출 데이터 조회
  async getAdministrativeSales(
    code: string,
    limit: number = 5,
  ): Promise<SalesDong[]> {
    return this.prisma.salesDong.findMany({
      where: { ADSTRD_CD: code },
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: limit,
    });
  }
}
