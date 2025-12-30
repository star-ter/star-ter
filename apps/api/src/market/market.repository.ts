import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AdministrativeAreaResult,
  CommercialAreaResult,
  GuAreaResult,
} from './dto/market.interface';

@Injectable()
export class MarketRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAdministrativeDistrict(
    lat: number,
    lng: number,
  ): Promise<AdministrativeAreaResult | null> {
    const result = await this.prisma.$queryRaw<AdministrativeAreaResult[]>`
      SELECT adstrd_cd as "ADSTRD_CD", adm_nm as "ADSTRD_NM"
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

  // 상권 매출 추이 조회 (분기별 업종 합계)
  async getCommercialRevenueTrend(code: string) {
    return this.prisma.salesCommercial.groupBy({
      by: ['STDR_YYQU_CD'],
      where: { TRDAR_CD: code },
      _sum: {
        THSMON_SELNG_AMT: true,
        TMZON_00_06_SELNG_AMT: true,
        TMZON_06_11_SELNG_AMT: true,
        TMZON_11_14_SELNG_AMT: true,
        TMZON_14_17_SELNG_AMT: true,
        TMZON_17_21_SELNG_AMT: true,
        TMZON_21_24_SELNG_AMT: true,
        MON_SELNG_AMT: true,
        TUES_SELNG_AMT: true,
        WED_SELNG_AMT: true,
        THUR_SELNG_AMT: true,
        FRI_SELNG_AMT: true,
        SAT_SELNG_AMT: true,
        SUN_SELNG_AMT: true,
        ML_SELNG_AMT: true,
        FML_SELNG_AMT: true,
        AGRDE_10_SELNG_AMT: true,
        AGRDE_20_SELNG_AMT: true,
        AGRDE_30_SELNG_AMT: true,
        AGRDE_40_SELNG_AMT: true,
        AGRDE_50_SELNG_AMT: true,
        AGRDE_60_ABOVE_SELNG_AMT: true,
      },
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: 5,
    });
  }

  // 행정동 매출 추이 조회 (분기별 업종 합계)
  async getAdminDongRevenueTrend(code: string) {
    return this.prisma.salesDong.groupBy({
      by: ['STDR_YYQU_CD'],
      where: { ADSTRD_CD: code },
      _sum: {
        THSMON_SELNG_AMT: true,
        TMZON_00_06_SELNG_AMT: true,
        TMZON_06_11_SELNG_AMT: true,
        TMZON_11_14_SELNG_AMT: true,
        TMZON_14_17_SELNG_AMT: true,
        TMZON_17_21_SELNG_AMT: true,
        TMZON_21_24_SELNG_AMT: true,
        MON_SELNG_AMT: true,
        TUES_SELNG_AMT: true,
        WED_SELNG_AMT: true,
        THUR_SELNG_AMT: true,
        FRI_SELNG_AMT: true,
        SAT_SELNG_AMT: true,
        SUN_SELNG_AMT: true,
        ML_SELNG_AMT: true,
        FML_SELNG_AMT: true,
        AGRDE_10_SELNG_AMT: true,
        AGRDE_20_SELNG_AMT: true,
        AGRDE_30_SELNG_AMT: true,
        AGRDE_40_SELNG_AMT: true,
        AGRDE_50_SELNG_AMT: true,
        AGRDE_60_ABOVE_SELNG_AMT: true,
      },
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: 5,
    });
  }

  // =====================================
  // 행정구 (Gu) 관련 메서드
  // =====================================

  /**
   * PostGIS: 좌표로 행정구 찾기
   * @param lat 위도
   * @param lng 경도
   * @returns 시군구 코드와 이름
   */
  async findAdministrativeGu(
    lat: number,
    lng: number,
  ): Promise<GuAreaResult | null> {
    // signgu_cd가 실제 행정구 코드 (text 타입)
    const result = await this.prisma.$queryRaw<GuAreaResult[]>`
      SELECT 
        signgu_cd as "SIGNGU_CD", 
        adm_nm as "SIGNGU_NM"
      FROM admin_area_gu
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

  /**
   * 행정구 매출 추이 조회 (분기별 업종 합계)
   * @param code 시군구 코드 (SIGNGU_CD)
   */
  async getAdminGuRevenueTrend(code: string) {
    return this.prisma.salesGu.groupBy({
      by: ['STDR_YYQU_CD'],
      where: { SIGNGU_CD: code },
      _sum: {
        THSMON_SELNG_AMT: true,
        TMZON_00_06_SELNG_AMT: true,
        TMZON_06_11_SELNG_AMT: true,
        TMZON_11_14_SELNG_AMT: true,
        TMZON_14_17_SELNG_AMT: true,
        TMZON_17_21_SELNG_AMT: true,
        TMZON_21_24_SELNG_AMT: true,
        MON_SELNG_AMT: true,
        TUES_SELNG_AMT: true,
        WED_SELNG_AMT: true,
        THUR_SELNG_AMT: true,
        FRI_SELNG_AMT: true,
        SAT_SELNG_AMT: true,
        SUN_SELNG_AMT: true,
        ML_SELNG_AMT: true,
        FML_SELNG_AMT: true,
        AGRDE_10_SELNG_AMT: true,
        AGRDE_20_SELNG_AMT: true,
        AGRDE_30_SELNG_AMT: true,
        AGRDE_40_SELNG_AMT: true,
        AGRDE_50_SELNG_AMT: true,
        AGRDE_60_ABOVE_SELNG_AMT: true,
      },
      orderBy: { STDR_YYQU_CD: 'desc' },
      take: 5,
    });
  }

  async getCommercialStoreStats(code: string) {
    return this.prisma.storeCommercial.aggregate({
      where: { TRDAR_CD: code },
      _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
      _max: { STDR_YYQU_CD: true },
    });
  }

  async getAdministrativeStoreStats(code: string) {
    return this.prisma.storeDong.aggregate({
      where: { ADSTRD_CD: code },
      _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
      _max: { STDR_YYQU_CD: true },
    });
  }

  /**
   * 행정구 상점 통계 조회 (개업/폐업 건수)
   * @param code 시군구 코드 (SIGNGU_CD)
   */
  async getGuStoreStats(code: string) {
    return this.prisma.storeGu.aggregate({
      where: { SIGNGU_CD: code },
      _sum: { STOR_CO: true, OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
      _max: { STDR_YYQU_CD: true },
    });
  }
}
