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
    const results = await this.prisma.$queryRaw<RawCommercialArea[]>`
    SELECT 
      trdar_se_1, 
      trdar_cd_n, 
      signgu_cd_, 
      adstrd_cd_, 
      ST_AsGeoJSON(ST_Simplify(geom,0.0001)) as geom 
    FROM seoul_commercial_area_grid
    WHERE ST_Intersects(geom, ST_MakeEnvelope(${minx}, ${miny}, ${maxx}, ${maxy}, 4326))
    `;

    return results.map((row) => ({
      properties: {
        commercialType: row.trdar_se_1,
        commercialName: row.trdar_cd_n,
        guCode: row.signgu_cd_,
        dongCode: row.adstrd_cd_,
      },
      polygons: JSON.parse(row.geom) as {
        type: string;
        coordinates: number[][][][] | number[][][] | number[][];
      },
    }));
  }

  getAdminPolygonByLowSearch(
    lowSearch: number,
  ): Promise<AdminPolygonResponse[]> {
    if (lowSearch == 2) {
      return this.prisma.adminAreaDong.findMany() as Promise<
        AdminPolygonResponse[]
      >;
    }
    return this.prisma.adminAreaGu.findMany() as Promise<
      AdminPolygonResponse[]
    >;
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
}
