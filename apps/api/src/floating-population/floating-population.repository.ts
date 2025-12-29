import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GeoJsonGeometry,
  FloatingPopulationRow,
  CombinedPopulationFeature,
} from './dto/floating-population-response.dto';

export interface GridCellGeometry {
  cell_id: string;
  geometry: GeoJsonGeometry;
}

interface GridCellRawResult {
  cell_id: string;
  geometry: string;
}

interface GridCombinedRawResult extends FloatingPopulationRow {
  cell_id: string;
  geometry: string;
}

@Injectable()
export class FloatingPopulationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // cell_id 리스트에 해당하는 격자정보 db에서 조회, ST_AsGeoJSON를 사용해서 이진데이터를 geojson으로 받아오기
  async findGridCellsByIds(cellIds: string[]): Promise<GridCellGeometry[]> {
    if (!cellIds || cellIds.length === 0) {
      return [];
    }

    const ids = cellIds.map((id) => `'${id}'`).join(',');
    const query = `
      SELECT 
        cell_id, 
        ST_AsGeoJSON(geom) as geometry
      FROM "seoul_250_grid"
      WHERE cell_id IN (${ids})
    `;

    const result =
      await this.prisma.$queryRawUnsafe<GridCellRawResult[]>(query);

    return result.map((row) => ({
      cell_id: row.cell_id,
      geometry: JSON.parse(row.geometry) as GeoJsonGeometry,
    }));
  }

  // 격자 정보를 조회, ST_Intersects와 ST_MakeEnvelope를 사용해서 공간검색 수행
  async findGridCellsByBounds(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<GridCellGeometry[]> {
    const query = `
      SELECT 
        cell_id, 
        ST_AsGeoJSON(geom) as geometry
      FROM "seoul_250_grid"
      WHERE ST_Intersects(
        geom,
        ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
      )
    `;

    const result =
      await this.prisma.$queryRawUnsafe<GridCellRawResult[]>(query);

    return result.map((row) => ({
      cell_id: row.cell_id,
      geometry: JSON.parse(row.geometry) as GeoJsonGeometry,
    }));
  }

  // 전역 공간 조인을 통해 영역내 격자 모양과 인구 데이터를 한번에 받아오기
  async findCombinedLayerByBounds(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<CombinedPopulationFeature[]> {
    const query = `
      SELECT 
        g.cell_id, 
        ST_AsGeoJSON(g.geom) as geometry,
        p.*
      FROM "seoul_250_grid" g
      JOIN "seoul_250_population" p ON g.cell_id = p."CELL_ID"
      WHERE ST_Intersects(
        g.geom,
        ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
      )
    `;

    const result =
      await this.prisma.$queryRawUnsafe<GridCombinedRawResult[]>(query);

    return result.map((row) => {
      const feature: CombinedPopulationFeature = {
        cell_id: row.cell_id,
        geometry: JSON.parse(row.geometry) as GeoJsonGeometry,
        population: this.mapRawToPopulationRow(row),
      };
      return feature;
    });
  }

  // 대량의 인구 데이터를 db에 업데이트, 삽입 PostgreSQL 전용
  async upsertPopulation(rows: FloatingPopulationRow[]) {
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      await this.prisma.$executeRawUnsafe(this.buildUpsertQuery(chunk));
    }
  }

  private mapRawToPopulationRow(
    raw: GridCombinedRawResult,
  ): FloatingPopulationRow {
    const cleaned = { ...raw };
    const getVal = (key: string) => Number(cleaned[key]) || 0;

    return {
      ...cleaned,
      YMD: raw.YMD,
      TT: raw.TT,
      H_DNG_CD: raw.H_DNG_CD,
      CELL_ID: raw.CELL_ID,
      SPOP: Number(raw.SPOP) || 0,
      pop_0_10: getVal('M00') + getVal('F00'),
      pop_10_20: getVal('M10') + getVal('M15') + getVal('F10') + getVal('F15'),
      pop_20_30: getVal('M20') + getVal('M25') + getVal('F20') + getVal('F25'),
      pop_30_40: getVal('M30') + getVal('M35') + getVal('F30') + getVal('F35'),
      pop_40_50: getVal('M40') + getVal('M45') + getVal('F40') + getVal('F45'),
      pop_50_60: getVal('M50') + getVal('M55') + getVal('F50') + getVal('F55'),
      pop_60_plus:
        getVal('M60') +
        getVal('M65') +
        getVal('M70') +
        getVal('F60') +
        getVal('F65') +
        getVal('F70'),
    } as FloatingPopulationRow;
  }

  private buildUpsertQuery(rows: FloatingPopulationRow[]): string {
    const columns = [
      'YMD',
      'TT',
      'CELL_ID',
      'H_DNG_CD',
      'SPOP',
      'M00',
      'M10',
      'M15',
      'M20',
      'M25',
      'M30',
      'M35',
      'M40',
      'M45',
      'M50',
      'M55',
      'M60',
      'M65',
      'M70',
      'F00',
      'F10',
      'F15',
      'F20',
      'F25',
      'F30',
      'F35',
      'F40',
      'F45',
      'F50',
      'F55',
      'F60',
      'F65',
      'F70',
    ];

    const values = rows
      .map((r) => {
        const rowValues = columns.map((col) => {
          const val = r[col];
          if (typeof val === 'string') return `'${val}'`;
          if (val === null || val === undefined) return 'NULL';
          return String(val);
        });
        return `(${rowValues.join(',')})`;
      })
      .join(',');

    const updateActions = columns
      .filter((col) => !['YMD', 'TT', 'CELL_ID'].includes(col))
      .map((col) => `"${col}" = EXCLUDED."${col}"`)
      .join(',');

    return `
      INSERT INTO "seoul_250_population" ("${columns.join('","')}")
      VALUES ${values}
      ON CONFLICT ("YMD", "TT", "CELL_ID")
      DO UPDATE SET ${updateActions}, updated_at = NOW();
    `;
  }
}
