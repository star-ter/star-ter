import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GeoJsonGeometry,
  FloatingPopulationRow,
  CombinedPopulationFeature,
  TimeSegmentedPopulationFeature,
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

interface RawTimeSegmentedResult {
  cell_id: string;
  geometry: string;
  time_slot: string;
  avg_population: number;
  sum_population: number;
  male_total: number;
  female_total: number;
  age_10s: number;
  age_20s: number;
  age_30s: number;
  age_40s: number;
  age_50s: number;
  age_60s: number;
}

@Injectable()
export class FloatingPopulationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // cell_id 리스트에 해당하는 격자정보 db에서 조회
  async findGridCellsByIds(cellIds: string[]): Promise<GridCellGeometry[]> {
    if (!cellIds || cellIds.length === 0) return [];
    const ids = cellIds.map((id) => `'${id}'`).join(',');
    const query = `
      SELECT cell_id, ST_AsGeoJSON(geom) as geometry
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

  // 격자 정보를 조회 (공간검색)
  async findGridCellsByBounds(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<GridCellGeometry[]> {
    const query = `
      SELECT cell_id, ST_AsGeoJSON(geom) as geometry
      FROM "seoul_250_grid"
      WHERE ST_Intersects(geom, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))
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
      SELECT g.cell_id, ST_AsGeoJSON(g.geom) as geometry, p.*
      FROM "seoul_250_grid" g
      JOIN "seoul_250_population" p ON g.cell_id = p."CELL_ID"
      WHERE ST_Intersects(g.geom, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))
    `;
    const result =
      await this.prisma.$queryRawUnsafe<GridCombinedRawResult[]>(query);
    return result.map((row) => ({
      cell_id: row.cell_id,
      geometry: JSON.parse(row.geometry) as GeoJsonGeometry,
      population: this.mapRawToPopulationRow(row),
    }));
  }

  /**
   * 지도 영역 내의 격자 정보와 시간대별(0-8, 8-16, 16-24) 인구 데이터를 한 번에 가져오는 쿼리
   */
  async findTimeSegmentedLayer(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<TimeSegmentedPopulationFeature[]> {
    const query = `
      WITH grid_selection AS (
        SELECT cell_id, geom 
        FROM "seoul_250_grid"
        WHERE ST_Intersects(geom, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))
      ),
      time_aggregated AS (
        SELECT 
          p."CELL_ID" as cell_id,
          CASE 
            WHEN CAST(p."TT" AS INTEGER) BETWEEN 0 AND 7 THEN '0-8'
            WHEN CAST(p."TT" AS INTEGER) BETWEEN 8 AND 15 THEN '8-16'
            ELSE '16-24'
          END as time_slot,
          AVG(p."SPOP") as avg_pop,
          SUM(p."SPOP") as sum_pop,
          SUM(p."M00"+p."M10"+p."M15"+p."M20"+p."M25"+p."M30"+p."M35"+p."M40"+p."M45"+p."M50"+p."M55"+p."M60"+p."M65"+p."M70") as male_total,
          SUM(p."F00"+p."F10"+p."F15"+p."F20"+p."F25"+p."F30"+p."F35"+p."F40"+p."F45"+p."F50"+p."F55"+p."F60"+p."F65"+p."F70") as female_total,
          SUM(p."M10"+p."M15"+p."F10"+p."F15") as age_10s,
          SUM(p."M20"+p."M25"+p."F20"+p."F25") as age_20s,
          SUM(p."M30"+p."M35"+p."F30"+p."F35") as age_30s,
          SUM(p."M40"+p."M45"+p."F40"+p."F45") as age_40s,
          SUM(p."M50"+p."M55"+p."F50"+p."F55") as age_50s,
          SUM(p."M60"+p."M65"+p."M70"+p."F60"+p."F65"+p."F70") as age_60s
        FROM "seoul_250_population" p
        JOIN grid_selection g ON p."CELL_ID" = g.cell_id
        GROUP BY p."CELL_ID", time_slot
      )
      SELECT 
        g.cell_id, ST_AsGeoJSON(g.geom) as geometry, t.time_slot,
        t.avg_pop as avg_population, t.sum_pop as sum_population, t.male_total, t.female_total,
        t.age_10s, t.age_20s, t.age_30s, t.age_40s, t.age_50s, t.age_60s
      FROM grid_selection g
      JOIN time_aggregated t ON g.cell_id = t.cell_id
      ORDER BY g.cell_id, t.time_slot;
    `;
    const rawResults =
      await this.prisma.$queryRawUnsafe<RawTimeSegmentedResult[]>(query);
    const featuresMap = new Map<string, TimeSegmentedPopulationFeature>();
    for (const row of rawResults) {
      if (!featuresMap.has(row.cell_id)) {
        featuresMap.set(row.cell_id, {
          cell_id: row.cell_id,
          geometry: JSON.parse(row.geometry) as GeoJsonGeometry,
          time_slots: [],
        });
      }
      const feature = featuresMap.get(row.cell_id)!;
      feature.time_slots.push({
        time_slot: row.time_slot,
        avg_population: Number(row.avg_population) || 0,
        sum_population: Number(row.sum_population) || 0,
        male_total: Number(row.male_total) || 0,
        female_total: Number(row.female_total) || 0,
        age_10s_total: Number(row.age_10s) || 0,
        age_20s_total: Number(row.age_20s) || 0,
        age_30s_total: Number(row.age_30s) || 0,
        age_40s_total: Number(row.age_40s) || 0,
        age_50s_total: Number(row.age_50s) || 0,
        age_60s_plus_total: Number(row.age_60s) || 0,
      });
    }
    return Array.from(featuresMap.values());
  }

  // 대량의 인구 데이터를 db에 업데이트, 삽입
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
    const columns: (keyof FloatingPopulationRow)[] = [
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
      .map((r: FloatingPopulationRow) => {
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
      .filter((col) => !['YMD', 'TT', 'CELL_ID'].includes(col as string))
      .map((col) => `"${String(col)}" = EXCLUDED."${String(col)}"`)
      .join(',');

    return `
      INSERT INTO "seoul_250_population" ("${columns.join('","')}")
      VALUES ${values}
      ON CONFLICT ("YMD", "TT", "CELL_ID")
      DO UPDATE SET ${updateActions}, updated_at = NOW();
    `;
  }
}
