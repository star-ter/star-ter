import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import {
  FloatingPopulationRepository,
  GridCellGeometry,
} from './floating-population.repository';
import {
  FloatingPopulationResponse,
  FloatingPopulationRow,
  RawSeoulXmlResponse,
  CombinedLayerResponse,
  CombinedPopulationFeature,
} from './dto/floating-population-response.dto';

@Injectable()
export class FloatingPopulationService {
  private readonly logger = new Logger(FloatingPopulationService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'http://openapi.seoul.go.kr:8088';
  private readonly parser = new XMLParser();

  private cachedPopulationMap: Map<string, FloatingPopulationRow> = new Map();
  private lastFetchTime = 0;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30분 캐시

  constructor(
    private readonly configService: ConfigService,
    private readonly repository: FloatingPopulationRepository,
  ) {
    this.apiKey =
      this.configService.get<string>('SEOUL_OPEN_API_KEY') || 'sample';
  }

  /**
   * 특정 영역(Bounds) 내의 유동인구 레이어만 반환합니다.
   * 성능 최적화의 핵심입니다.
   */
  async getCombinedLayerByBounds(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<CombinedLayerResponse> {
    // 1. 인구 데이터 로드 (캐시 우선)
    const populationMap = await this.getOrFetchPopulation();

    // 2. DB에서 해당 영역의 격자만 조회
    const grids = await this.repository.findGridCellsByBounds(
      minLat,
      minLng,
      maxLat,
      maxLng,
    );
    return this.joinGridsWithPopulation(grids, populationMap);
  }

  private async getOrFetchPopulation(): Promise<
    Map<string, FloatingPopulationRow>
  > {
    const now = Date.now();
    if (
      this.cachedPopulationMap.size > 0 &&
      now - this.lastFetchTime < this.CACHE_TTL
    ) {
      return this.cachedPopulationMap;
    }

    // 서울시 격자수가 약 16,000~18,000개 정도이므로 19,000개까지 넉넉하게 가져옵니다.
    const data = await this.getPopulationData(1, 19000);

    const newMap = new Map<string, FloatingPopulationRow>();
    data.row.forEach((row) => newMap.set(row.CELL_ID, row));

    this.cachedPopulationMap = newMap;
    this.lastFetchTime = now;

    return this.cachedPopulationMap;
  }

  private joinGridsWithPopulation(
    grids: GridCellGeometry[],
    populationMap: Map<string, FloatingPopulationRow>,
  ): CombinedLayerResponse {
    const combinedFeatures: CombinedPopulationFeature[] = [];

    grids.forEach((grid) => {
      const population = populationMap.get(grid.cell_id);
      if (population) {
        combinedFeatures.push({
          cell_id: grid.cell_id,
          geometry: grid.geometry,
          population: population,
        });
      }
    });

    const firstPop = Array.from(populationMap.values())[0];

    return {
      ymd: firstPop?.YMD || '',
      tt: firstPop?.TT || '',
      features: combinedFeatures,
    };
  }

  async getPopulationData(
    start: number,
    end: number,
  ): Promise<FloatingPopulationResponse> {
    const SERVICE_NAME = 'Se250MSpopLocalResd';
    const CHUNK_SIZE = 1000;

    const chunks: { start: number; end: number }[] = [];
    for (let s = start; s <= end; s += CHUNK_SIZE) {
      const e = Math.min(s + CHUNK_SIZE - 1, end);
      if (s <= end) chunks.push({ start: s, end: e });
    }

    try {
      let totalCount = 0;

      const chunkResults = await Promise.all(
        chunks.map(async (chunk) => {
          const url = `${this.baseUrl}/${this.apiKey}/xml/${SERVICE_NAME}/${chunk.start}/${chunk.end}/`;
          const resp = await fetch(url);
          if (!resp.ok) return null;

          const xml = await resp.text();
          const parsed = this.parser.parse(xml) as RawSeoulXmlResponse;
          const result = parsed[SERVICE_NAME];

          if (!result || 'CODE' in result) return null;

          const count = Number(result.list_total_count) || 0;
          if (count > totalCount) totalCount = count;

          const rows = result.row
            ? Array.isArray(result.row)
              ? result.row
              : [result.row]
            : [];
          return rows.map((r) =>
            this.cleanRowData(r as unknown as FloatingPopulationRow),
          );
        }),
      );

      const cellMap = new Map<string, FloatingPopulationRow>();

      chunkResults.forEach((rows) => {
        if (!rows) return;
        rows.forEach((row) => {
          if (!cellMap.has(row.CELL_ID)) {
            cellMap.set(row.CELL_ID, { ...row });
          } else {
            const existing = cellMap.get(row.CELL_ID)!;
            existing.SPOP += row.SPOP;
            const keys = Object.keys(existing) as Array<
              keyof FloatingPopulationRow
            >;
            keys.forEach((key) => {
              if (
                key.startsWith('M') ||
                key.startsWith('F') ||
                key.startsWith('pop_')
              ) {
                if (
                  typeof existing[key] === 'number' &&
                  typeof row[key] === 'number'
                ) {
                  (existing as unknown as Record<string, number>)[key] +=
                    row[key];
                }
              }
            });
          }
        });
      });

      const finalRows = Array.from(cellMap.values());
      return {
        list_total_count: totalCount,
        RESULT: {
          CODE: 'INFO-000',
          MESSAGE: '정상 처리되었습니다',
        },
        row: finalRows,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error: ${errorMessage}`);
      throw new HttpException(
        `데이터 수집 중 오류 발생: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private cleanRowData(row: FloatingPopulationRow): FloatingPopulationRow {
    const cleaned = { ...row };
    const keys = Object.keys(cleaned) as Array<keyof FloatingPopulationRow>;

    for (const key of keys) {
      const value = cleaned[key];
      if (value === ('*' as unknown)) {
        (cleaned as Record<string, unknown>)[key] = 0;
      } else if (
        typeof value === 'string' &&
        !isNaN(Number(value)) &&
        !['H_DNG_CD', 'CELL_ID', 'YMD', 'TT'].includes(key)
      ) {
        (cleaned as Record<string, unknown>)[key] = Number(value);
      }
    }

    const getVal = (key: keyof FloatingPopulationRow) =>
      Number(cleaned[key]) || 0;
    cleaned.pop_0_10 = getVal('M00') + getVal('F00');
    cleaned.pop_10_20 =
      getVal('M10') + getVal('M15') + getVal('F10') + getVal('F15');
    cleaned.pop_20_30 =
      getVal('M20') + getVal('M25') + getVal('F20') + getVal('F25');
    cleaned.pop_30_40 =
      getVal('M30') + getVal('M35') + getVal('F30') + getVal('F35');
    cleaned.pop_40_50 =
      getVal('M40') + getVal('M45') + getVal('F40') + getVal('F45');
    cleaned.pop_50_60 =
      getVal('M50') + getVal('M55') + getVal('F50') + getVal('F55');
    cleaned.pop_60_plus =
      getVal('M60') +
      getVal('M65') +
      getVal('M70') +
      getVal('F60') +
      getVal('F65') +
      getVal('F70');

    return cleaned;
  }
}
