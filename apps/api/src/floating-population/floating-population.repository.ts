import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GeoJsonGeometry,
  TimeSegmentedPopulationFeature,
} from './dto/floating-population-response.dto';

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

  /**
   * 지도 영역 내의 격자 정보와 시간대별(0-8, 8-16, 16-24) 인구 데이터를 한 번에 가져오는 쿼리
   * 불필요한 로깅을 배제하고 공간 인덱스(GIST)를 활용하도록 작성
   */
  async findTimeSegmentedLayer(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<TimeSegmentedPopulationFeature[]> {
    const query = `
      WITH grid_selection AS (
        -- 1. 공간 필터링을 통해 필요한 격자만 먼저 선택
        SELECT cell_id, geom 
        FROM "seoul_250_grid"
        WHERE ST_Intersects(
          geom,
          ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
        )
      ),
      time_aggregated AS (
        -- 2. 선택된 격자에 대해 시간대별 인구 데이터 집계 (SUM 사용)
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
      -- 3. 최종적으로 공간 데이터와 조인하여 GeoJSON 지오메트리 포함
      SELECT 
        g.cell_id,
        ST_AsGeoJSON(g.geom) as geometry,
        t.time_slot,
        t.avg_pop as avg_population,
        t.sum_pop as sum_population,
        t.male_total,
        t.female_total,
        t.age_10s,
        t.age_20s,
        t.age_30s,
        t.age_40s,
        t.age_50s,
        t.age_60s
      FROM grid_selection g
      JOIN time_aggregated t ON g.cell_id = t.cell_id
      ORDER BY g.cell_id, t.time_slot;
    `;

    const rawResults =
      await this.prisma.$queryRawUnsafe<RawTimeSegmentedResult[]>(query);

    // SQL 결과를 NestJS DTO 구조로 그룹화 (Cell ID 기준)
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
}
