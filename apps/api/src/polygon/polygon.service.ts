import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BuildingPolygonResponse } from './dto/building-polygon-dto';
import { AdminPolygonResponse } from './dto/admin-polygon-dto';
import { CommercialPolygonResponse } from './dto/commercial-polygon-dto';
import { RawCommercialArea } from './dto/raw-commercial-area.dto';
import { RawCommercialBuilding } from './dto/raw-commercial-building.dto';

const LATEST_QUARTER = '20253';

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
        trdar_cd,
        trdar_se_1, 
        trdar_cd_n, 
        signgu_cd_, 
        adstrd_cd_, 
        ST_AsGeoJSON(ST_Simplify(geom,0.0001)) as geom 
      FROM seoul_commercial_area_grid
      WHERE ST_Intersects(geom, ST_MakeEnvelope(${minx}, ${miny}, ${maxx}, ${maxy}, 4326))
    `;

    const trdarCds = results.map((r) => r.trdar_cd).filter((c) => !!c);
    const revenueMap = new Map<string, number>();
    const populationMap = new Map<string, number>();
    const openingStoresMap = new Map<string, number>();
    const closingStoresMap = new Map<string, number>();

    if (trdarCds.length > 0) {
      const sales = await this.prisma.salesCommercial.groupBy({
        by: ['TRDAR_CD'],
        where: {
          TRDAR_CD: { in: trdarCds },
          STDR_YYQU_CD: LATEST_QUARTER,
        },
        _sum: { THSMON_SELNG_AMT: true },
      });
      sales.forEach((s) => {
        if (s.TRDAR_CD) {
          revenueMap.set(s.TRDAR_CD, Number(s._sum.THSMON_SELNG_AMT || 0));
        }
      });

      const pop = await this.prisma.residentPopulationCommercial.findMany({
        where: {
          TRDAR_CD: { in: trdarCds },
          STDR_YYQU_CD: LATEST_QUARTER,
        },
        select: { TRDAR_CD: true, TOT_REPOP_CO: true },
      });
      pop.forEach((p) => populationMap.set(p.TRDAR_CD, p.TOT_REPOP_CO));

      const openings = await this.prisma.storeCommercial.groupBy({
        by: ['TRDAR_CD'],
        where: {
          TRDAR_CD: { in: trdarCds },
          STDR_YYQU_CD: LATEST_QUARTER,
        },
        _sum: { OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
      });
      openings.forEach((s) => {
        if (s.TRDAR_CD) {
          openingStoresMap.set(s.TRDAR_CD, s._sum.OPBIZ_STOR_CO || 0);
          closingStoresMap.set(s.TRDAR_CD, s._sum.CLSBIZ_STOR_CO || 0);
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
      residentPopulation: populationMap.get(row.trdar_cd) || 0,
      openingStores: openingStoresMap.get(row.trdar_cd) || 0,
      closingStores: closingStoresMap.get(row.trdar_cd) || 0,
      polygons: JSON.parse(row.geom) as {
        type: string;
        coordinates: number[][][][] | number[][][] | number[][];
      },
    }));
  }

  async getAdminPolygonByLowSearch(
    lowSearch: number,
  ): Promise<AdminPolygonResponse[]> {
    if (lowSearch === 2) {
      return this.fetchAdminData('dong');
    } else {
      return this.fetchAdminData('gu');
    }
  }

  private async fetchAdminData(
    type: 'gu' | 'dong',
  ): Promise<AdminPolygonResponse[]> {
    const revenueMap = new Map<string, number>();
    const populationMap = new Map<string, number>();
    const openingStoresMap = new Map<string, number>();
    const closingStoresMap = new Map<string, number>();

    let polygons: AdminPolygonResponse[] = [];

    if (type === 'dong') {
      polygons =
        (await this.prisma.adminAreaDong.findMany()) as unknown as AdminPolygonResponse[];

      const sales = await this.prisma.salesDong.groupBy({
        by: ['ADSTRD_CD'],
        where: { STDR_YYQU_CD: LATEST_QUARTER },
        _sum: { THSMON_SELNG_AMT: true },
      });
      sales.forEach(
        (s) =>
          s.ADSTRD_CD &&
          revenueMap.set(s.ADSTRD_CD, Number(s._sum.THSMON_SELNG_AMT || 0)),
      );

      const pop = await this.prisma.residentPopulationDong.findMany({
        where: { STDR_YYQU_CD: LATEST_QUARTER },
        select: { ADSTRD_CD: true, TOT_REPOP_CO: true },
      });
      pop.forEach((p) => populationMap.set(p.ADSTRD_CD, p.TOT_REPOP_CO));

      const openings = await this.prisma.storeDong.groupBy({
        by: ['ADSTRD_CD'],
        where: { STDR_YYQU_CD: LATEST_QUARTER },
        _sum: { OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
      });
      openings.forEach(
        (s) =>
          s.ADSTRD_CD &&
          (openingStoresMap.set(s.ADSTRD_CD, s._sum.OPBIZ_STOR_CO || 0),
          closingStoresMap.set(s.ADSTRD_CD, s._sum.CLSBIZ_STOR_CO || 0)),
      );

      return polygons.map((p) => ({
        ...p,
        revenue: p.adstrd_cd ? revenueMap.get(p.adstrd_cd) || 0 : 0,
        residentPopulation: p.adstrd_cd
          ? populationMap.get(p.adstrd_cd) || 0
          : 0,
        openingStores: p.adstrd_cd ? openingStoresMap.get(p.adstrd_cd) || 0 : 0,
        closingStores: p.adstrd_cd ? closingStoresMap.get(p.adstrd_cd) || 0 : 0,
      }));
    } else {
      polygons =
        (await this.prisma.adminAreaGu.findMany()) as unknown as AdminPolygonResponse[];

      const sales = await this.prisma.salesGu.groupBy({
        by: ['SIGNGU_CD'],
        where: { STDR_YYQU_CD: LATEST_QUARTER },
        _sum: { THSMON_SELNG_AMT: true },
      });
      sales.forEach(
        (s) =>
          s.SIGNGU_CD &&
          revenueMap.set(s.SIGNGU_CD, Number(s._sum.THSMON_SELNG_AMT || 0)),
      );

      const pop = await this.prisma.residentPopulationGu.findMany({
        where: { STDR_YYQU_CD: LATEST_QUARTER },
        select: { SIGNGU_CD: true, TOT_REPOP_CO: true },
      });
      pop.forEach((p) => populationMap.set(p.SIGNGU_CD, p.TOT_REPOP_CO));

      const openings = await this.prisma.storeGu.groupBy({
        by: ['SIGNGU_CD'],
        where: { STDR_YYQU_CD: LATEST_QUARTER },
        _sum: { OPBIZ_STOR_CO: true, CLSBIZ_STOR_CO: true },
      });
      openings.forEach(
        (s) =>
          s.SIGNGU_CD &&
          (openingStoresMap.set(s.SIGNGU_CD, s._sum.OPBIZ_STOR_CO || 0),
          closingStoresMap.set(s.SIGNGU_CD, s._sum.CLSBIZ_STOR_CO || 0)),
      );

      return polygons.map((p) => ({
        ...p,
        revenue: p.signgu_cd ? revenueMap.get(p.signgu_cd) || 0 : 0,
        residentPopulation: p.signgu_cd
          ? populationMap.get(p.signgu_cd) || 0
          : 0,
        openingStores: p.signgu_cd ? openingStoresMap.get(p.signgu_cd) || 0 : 0,
        closingStores: p.signgu_cd ? closingStoresMap.get(p.signgu_cd) || 0 : 0,
      }));
    }
  }

  async getCommercialBuildingPolygons(
    minx: string,
    miny: string,
    maxx: string,
    maxy: string,
  ): Promise<BuildingPolygonResponse[]> {
    try {
      const results = await this.prisma.$queryRaw<RawCommercialBuilding[]>`
        SELECT DISTINCT
          c.building_name as buld_nm,
          c.lot_address as adm_nm,
          ST_AsGeoJSON(ST_SnapToGrid(b.geom, 0.00001)) as geom
        FROM building_integrated_info b
        JOIN seoul_commercial_store_info c ON b.unique_no = c.lot_code
        WHERE ST_Intersects(b.geom, ST_MakeEnvelope(${parseFloat(minx)}, ${parseFloat(miny)}, ${parseFloat(maxx)}, ${parseFloat(maxy)}, 4326))
      `;

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
