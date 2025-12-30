import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BuildingPolygonResponse } from './dto/building-polygon-dto';
import { AdminPolygonResponse } from './dto/admin-polygon-dto';
import { CommercialPolygonResponse } from './dto/commercial-polygon-dto';
import { RawCommercialArea } from './dto/raw-commercial-area.dto';
import { RawCommercialBuilding } from './dto/raw-commercial-building.dto';

@Injectable()
export class PolygonService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommercialPolygon(
    minx: string,
    miny: string,
    maxx: string,
    maxy: string,
  ): Promise<CommercialPolygonResponse[]> {
    // 1. Fetch Polygons
    const results = await this.prisma.$queryRaw<RawCommercialArea[]>`
    SELECT 
      trdar_cd,
      trdar_se_1, 
      trdar_cd_n, 
      signgu_cd_, 
      adstrd_cd_, 
      ST_AsGeoJSON(ST_Simplify(geom,0.0001)) as geom 
    FROM seoul_commercial_area_grid
    WHERE ST_Intersects(geom, ST_MakeEnvelope(${minx}, ${miny}, ${maxx}, ${maxy}, 4326))
    `;

    // 2. Fetch Sales (Opt-in for performance, only if results exist)
    const latestQuarter = '20253';
    const trdarCds = results.map((r) => r.trdar_cd).filter((c) => !!c);
    const revenueMap = new Map<string, number>();

    if (trdarCds.length > 0) {
      const sales = await this.prisma.salesCommercial.groupBy({
        by: ['TRDAR_CD'],
        where: {
          TRDAR_CD: { in: trdarCds },
          STDR_YYQU_CD: latestQuarter,
        },
        _sum: { THSMON_SELNG_AMT: true },
      });
      sales.forEach((s) => {
        if (s.TRDAR_CD) {
          revenueMap.set(s.TRDAR_CD, Number(s._sum.THSMON_SELNG_AMT || 0));
        }
      });
    }

    return results.map((row) => ({
      properties: {
        commercialType: row.trdar_se_1,
        commercialName: row.trdar_cd_n,
        guCode: row.signgu_cd_,
        dongCode: row.adstrd_cd_,
      },
      code: row.trdar_cd,
      revenue: revenueMap.get(row.trdar_cd) || 0,
      polygons: JSON.parse(row.geom) as {
        type: string;
        coordinates: number[][][][] | number[][][] | number[][];
      },
    }));
  }

  async getAdminPolygonByLowSearch(
    lowSearch: number,
  ): Promise<AdminPolygonResponse[]> {
    const latestQuarter = '20253';
    const revenueMap = new Map<string, number>();

    if (lowSearch == 2) {
      // 1. Dong Level Polygon
      const polygons =
        (await this.prisma.adminAreaDong.findMany()) as unknown as AdminPolygonResponse[];
      // 2. Dong Level Sales (Group by ADSTRD_CD)
      const sales = await this.prisma.salesDong.groupBy({
        by: ['ADSTRD_CD'],
        where: { STDR_YYQU_CD: latestQuarter },
        _sum: { THSMON_SELNG_AMT: true },
      });
      // 3. Map Sales
      sales.forEach((s) => {
        if (s.ADSTRD_CD) {
          revenueMap.set(s.ADSTRD_CD, Number(s._sum.THSMON_SELNG_AMT || 0));
        }
      });
      // 4. Merge
      return polygons.map((p) => ({
        ...p,
        revenue: p.adstrd_cd ? revenueMap.get(p.adstrd_cd) || 0 : 0,
      }));
    } else {
      // 1. Gu Level Polygon
      const polygons =
        (await this.prisma.adminAreaGu.findMany()) as unknown as AdminPolygonResponse[];
      // 2. Gu Level Sales (Group by SIGNGU_CD)
      const sales = await this.prisma.salesGu.groupBy({
        by: ['SIGNGU_CD'],
        where: { STDR_YYQU_CD: latestQuarter },
        _sum: { THSMON_SELNG_AMT: true },
      });
      // 3. Map Sales
      sales.forEach((s) => {
        if (s.SIGNGU_CD) {
          revenueMap.set(s.SIGNGU_CD, Number(s._sum.THSMON_SELNG_AMT || 0));
        }
      });
      // 4. Merge
      return polygons.map((p) => ({
        ...p,
        revenue: p.signgu_cd ? revenueMap.get(p.signgu_cd) || 0 : 0,
      }));
    }
  }

  // 상권 정보가 있는 건물만 필터링하여 조회 (DB 기반)
  async getCommercialBuildingPolygons(
    minx: string,
    miny: string,
    maxx: string,
    maxy: string,
  ): Promise<BuildingPolygonResponse[]> {
    try {
      // 1. Prisma $queryRaw로 JOIN 쿼리 실행
      // building_integrated_info (b)와 seoul_commercial_store_info (c)를 unique_no = lot_code 로 조인
      const results = await this.prisma.$queryRaw<RawCommercialBuilding[]>`
        SELECT DISTINCT
          c.building_name as buld_nm,
          c.lot_address as adm_nm,
          ST_AsGeoJSON(ST_SnapToGrid(b.geom, 0.00001)) as geom
        FROM building_integrated_info b
        JOIN seoul_commercial_store_info c ON b.unique_no = c.lot_code
        WHERE ST_Intersects(b.geom, ST_MakeEnvelope(${parseFloat(minx)}, ${parseFloat(miny)}, ${parseFloat(maxx)}, ${parseFloat(maxy)}, 4326))
      `;

      // 2. 결과 매핑
      return results.map((row) => {
        const geoJson = JSON.parse(row.geom) as {
          coordinates: number[][][][] | number[][][] | number[][];
        };
        return {
          buld_nm: row.buld_nm || '건물명 없음',
          adm_nm: row.adm_nm || '',
          polygons: geoJson.coordinates,
        } as BuildingPolygonResponse;
      });
    } catch (error) {
      console.error('DB Commercial Building Fetch Error:', error);
      throw new InternalServerErrorException(
        'Failed to fetch commercial building polygons',
      );
    }
  }

  // 서울특별시 시도 경계 데이터 조회
  async getSeoulSidoPolygon(): Promise<AdminPolygonResponse | null> {
    const result = await this.prisma.adminAreaSido.findFirst({
      where: {
        adm_nm: '서울특별시',
      },
    });

    if (!result) return null;

    return result as unknown as AdminPolygonResponse;
  }
}
