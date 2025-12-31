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

  private globalRankCache: {
    revenue: Map<string, number>;
    population: Map<string, number>;
    opening: Map<string, number>;
    closing: Map<string, number>;
  } | null = null;

  private async ensureGlobalRanks() {
    if (this.globalRankCache) return;

    const quarter = LATEST_QUARTER;

    const revenueTop = await this.prisma.salesCommercial.groupBy({
      by: ['trdar_cd'],
      where: { stdr_yyqu_cd: quarter },
      _sum: { thsmon_selng_amt: true },
      orderBy: {
        _sum: {
          thsmon_selng_amt: 'desc',
        },
      },
      take: 3,
    });

    const popTop = await this.prisma.residentPopulationCommercial.findMany({
      where: { stdr_yyqu_cd: quarter },
      orderBy: { tot_repop_co: 'desc' },
      take: 3,
      select: { trdar_cd: true },
    });

    const openTop = await this.prisma.storeCommercial.groupBy({
      by: ['trdar_cd'],
      where: { stdr_yyqu_cd: quarter },
      _sum: { opbiz_stor_co: true },
      orderBy: {
        _sum: {
          opbiz_stor_co: 'desc',
        },
      },
      take: 3,
    });

    const closeTop = await this.prisma.storeCommercial.groupBy({
      by: ['trdar_cd'],
      where: { stdr_yyqu_cd: quarter },
      _sum: { clsbiz_stor_co: true },
      orderBy: {
        _sum: {
          clsbiz_stor_co: 'asc',
        },
      },
      take: 3,
    });

    const buildMap = (rows: { trdar_cd: string | null }[]) => {
      const map = new Map<string, number>();
      rows.forEach((r, i) => {
        if (r.trdar_cd) map.set(r.trdar_cd, i + 1);
      });
      return map;
    };

    this.globalRankCache = {
      revenue: buildMap(revenueTop),
      population: buildMap(popTop),
      opening: buildMap(openTop),
      closing: buildMap(closeTop),
    };
  }

  async getCommercialPolygon(
    minx: string,
    miny: string,
    maxx: string,
    maxy: string,
  ): Promise<CommercialPolygonResponse[]> {
    await this.ensureGlobalRanks();

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
        by: ['trdar_cd'],
        where: {
          trdar_cd: { in: trdarCds },
          stdr_yyqu_cd: LATEST_QUARTER,
        },
        _sum: { thsmon_selng_amt: true },
      });
      sales.forEach((s) => {
        if (s.trdar_cd) {
          revenueMap.set(s.trdar_cd, Number(s._sum.thsmon_selng_amt || 0));
        }
      });

      const pop = await this.prisma.residentPopulationCommercial.findMany({
        where: {
          trdar_cd: { in: trdarCds },
          stdr_yyqu_cd: LATEST_QUARTER,
        },
        select: { trdar_cd: true, tot_repop_co: true },
      });
      pop.forEach((p) => populationMap.set(p.trdar_cd, p.tot_repop_co));

      const openings = await this.prisma.storeCommercial.groupBy({
        by: ['trdar_cd'],
        where: {
          trdar_cd: { in: trdarCds },
          stdr_yyqu_cd: LATEST_QUARTER,
        },
        _sum: { opbiz_stor_co: true, clsbiz_stor_co: true },
      });
      openings.forEach((s) => {
        if (s.trdar_cd) {
          openingStoresMap.set(s.trdar_cd, s._sum.opbiz_stor_co || 0);
          closingStoresMap.set(s.trdar_cd, s._sum.clsbiz_stor_co || 0);
        }
      });
    }

    const { revenue, population, opening, closing } = this.globalRankCache!;

    return results.map(
      (row) =>
        ({
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
          rankRevenue: revenue.get(row.trdar_cd),
          rankPopulation: population.get(row.trdar_cd),
          rankOpening: opening.get(row.trdar_cd),
          rankClosing: closing.get(row.trdar_cd),
          polygons: JSON.parse(row.geom) as {
            type: string;
            coordinates: number[][][][] | number[][][] | number[][];
          },
        }) as CommercialPolygonResponse,
    );
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
        by: ['adstrd_cd'],
        where: { stdr_yyqu_cd: LATEST_QUARTER },
        _sum: { thsmon_selng_amt: true },
      });
      sales.forEach(
        (s) =>
          s.adstrd_cd &&
          revenueMap.set(s.adstrd_cd, Number(s._sum.thsmon_selng_amt || 0)),
      );

      const pop = await this.prisma.residentPopulationDong.findMany({
        where: { stdr_yyqu_cd: LATEST_QUARTER },
        select: { adstrd_cd: true, tot_repop_co: true },
      });
      pop.forEach((p) => populationMap.set(p.adstrd_cd, p.tot_repop_co));

      const openings = await this.prisma.storeDong.groupBy({
        by: ['adstrd_cd'],
        where: { stdr_yyqu_cd: LATEST_QUARTER },
        _sum: { opbiz_stor_co: true, clsbiz_stor_co: true },
      });
      openings.forEach(
        (s) =>
          s.adstrd_cd &&
          (openingStoresMap.set(s.adstrd_cd, s._sum.opbiz_stor_co || 0),
          closingStoresMap.set(s.adstrd_cd, s._sum.clsbiz_stor_co || 0)),
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
        by: ['signgu_cd'],
        where: { stdr_yyqu_cd: LATEST_QUARTER },
        _sum: { thsmon_selng_amt: true },
      });
      sales.forEach(
        (s) =>
          s.signgu_cd &&
          revenueMap.set(s.signgu_cd, Number(s._sum.thsmon_selng_amt || 0)),
      );

      const pop = await this.prisma.residentPopulationGu.findMany({
        where: { stdr_yyqu_cd: LATEST_QUARTER },
        select: { signgu_cd: true, tot_repop_co: true },
      });
      pop.forEach((p) => populationMap.set(p.signgu_cd, p.tot_repop_co));

      const openings = await this.prisma.storeGu.groupBy({
        by: ['signgu_cd'],
        where: { stdr_yyqu_cd: LATEST_QUARTER },
        _sum: { opbiz_stor_co: true, clsbiz_stor_co: true },
      });
      openings.forEach(
        (s) =>
          s.signgu_cd &&
          (openingStoresMap.set(s.signgu_cd, s._sum.opbiz_stor_co || 0),
          closingStoresMap.set(s.signgu_cd, s._sum.clsbiz_stor_co || 0)),
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
        WHERE b.geom && ST_MakeEnvelope(${minx}, ${miny}, ${maxx}, ${maxy}, 4326)
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
