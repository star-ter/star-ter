import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TimeSegmentedPopulationFeature,
  TimeSlotPopulation,
  GeoJsonGeometry,
} from './dto/floating-population-response.dto';

// 전역 상수 정의
const AGE_GROUPS = [
  '00',
  '10',
  '15',
  '20',
  '25',
  '30',
  '35',
  '40',
  '45',
  '50',
  '55',
  '60',
  '65',
  '70',
] as const;
const GENDERS = ['m', 'f'] as const;
const GRANULAR_FIELDS = GENDERS.flatMap((g) =>
  AGE_GROUPS.map((a) => `${g}${a}`),
);

/**
 * 데이터베이스 조회 결과 타입을 정의합니다.
 */
interface RawTimeSlotJson extends Record<string, any> {
  ts: string; // time_slot
  ap: number; // avg_pop
  sp: number; // sum_pop
}

interface RawQueryResult {
  id: string; // cell_id
  geom: string; // geometry
  slots: RawTimeSlotJson[]; // time_slots
}

@Injectable()
export class FloatingPopulationRepository {
  private readonly logger = new Logger(FloatingPopulationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * [Revolutionary Refactor]
   * 1. LEFT JOIN: seoul_250_grid를 기준으로 population을 붙여서 데이터가 없는 격자까지 "비교" 가능하게 조회합니다.
   * 2. Payload Optimization: 필드명을 단축(ts, ap, sp)하여 네트워크 전송량을 최소화했습니다.
   * 3. Logic: DB에서는 순수 데이터만 가져오고, 복합 합계(male_total 등)는 서버(TS)에서 계산합니다.
   */
  async findTimeSegmentedLayer(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<TimeSegmentedPopulationFeature[]> {
    // 28개 기초 필드 SUM 구문 생성
    const granularSums = GRANULAR_FIELDS.map(
      (f) => `SUM(p."${f}") as ${f}`,
    ).join(', ');

    const query = `
      WITH viewport_grids AS (
        SELECT cell_id, geom 
        FROM "seoul_250_grid"
        WHERE ST_Intersects(geom, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))
      ),
      population_stats AS (
        SELECT 
          p."cell_id" as cid,
          CASE 
            WHEN CAST(p."tt" AS INTEGER) BETWEEN 0 AND 7 THEN '0-8'
            WHEN CAST(p."tt" AS INTEGER) BETWEEN 8 AND 15 THEN '8-16'
            ELSE '16-24'
          END as ts,
          AVG(p."spop") as ap,
          SUM(p."spop") as sp,
          ${granularSums}
        FROM "seoul_250_population" p
        WHERE p."cell_id" IN (SELECT cell_id FROM viewport_grids)
        GROUP BY p."cell_id", ts
      )
      SELECT 
        g.cell_id as id, 
        ST_AsGeoJSON(g.geom) as geom, 
        json_agg(
          json_build_object(
            'ts', s.ts,
            'ap', s.ap,
            'sp', s.sp,
            ${GRANULAR_FIELDS.map((f) => `'${f}', s.${f}`).join(',\n')}
          ) ORDER BY s.ts
        ) FILTER (WHERE s.ts IS NOT NULL) as slots
      FROM viewport_grids g
      LEFT JOIN population_stats s ON g.cell_id = s.cid
      GROUP BY g.cell_id, g.geom;
    `;

    try {
      const rawResults =
        await this.prisma.$queryRawUnsafe<RawQueryResult[]>(query);

      return rawResults.map((row) => ({
        cell_id: row.id,
        geometry: JSON.parse(row.geom) as GeoJsonGeometry,
        time_slots: (row.slots || []).map((t) => {
          const slot = {
            time_slot: t.ts,
            avg_population: Number(t.ap) || 0,
            sum_population: Number(t.sp) || 0,
          } as TimeSlotPopulation;

          // 1. 기초 데이터 복사 및 성별 합계 계산
          let maleTotal = 0;
          let femaleTotal = 0;
          GRANULAR_FIELDS.forEach((f) => {
            const val = Number(t[f]) || 0;
            (slot as unknown as Record<string, number>)[f] = val;
            if (f.startsWith('m')) {
              maleTotal += val;
            } else {
              femaleTotal += val;
            }
          });

          slot.male_total = maleTotal;
          slot.female_total = femaleTotal;

          // 2. 연령대 합계 계산 (TS 이관으로 DB 부하 감소)
          const getSum = (...fields: (keyof TimeSlotPopulation)[]): number =>
            fields.reduce((sum, f) => sum + (Number(slot[f]) || 0), 0);

          slot.age_10s_total = getSum('m10', 'm15', 'f10', 'f15');
          slot.age_20s_total = getSum('m20', 'm25', 'f20', 'f25');
          slot.age_30s_total = getSum('m30', 'm35', 'f30', 'f35');
          slot.age_40s_total = getSum('m40', 'm45', 'f40', 'f45');
          slot.age_50s_total = getSum('m50', 'm55', 'f50', 'f55');
          slot.age_60s_plus_total = getSum(
            'm60',
            'm65',
            'm70',
            'f60',
            'f65',
            'f70',
          );
          return slot;
        }),
      }));
    } catch (error) {
      this.logger.error(
        'Database query failed in findTimeSegmentedLayer',
        error,
      );
      throw error;
    }
  }
}
