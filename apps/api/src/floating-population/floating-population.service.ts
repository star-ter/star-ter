import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { XMLParser } from 'fast-xml-parser';
import { FloatingPopulationRepository } from './floating-population.repository';
import {
  FloatingPopulationResponse,
  CombinedLayerResponse,
  FloatingPopulationRow,
  RawSeoulXmlResponse,
} from './dto/floating-population-response.dto';

@Injectable()
export class FloatingPopulationService implements OnModuleInit {
  private readonly apiKey: string;
  private readonly baseUrl = 'http://openapi.seoul.go.kr:8088';
  private readonly parser = new XMLParser();
  private readonly logger = new Logger(FloatingPopulationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly repository: FloatingPopulationRepository,
  ) {
    this.apiKey =
      this.configService.get<string>('SEOUL_OPEN_API_KEY') || 'sample';
  }

  // 모듈 초기화 시점에 한 번 데이터 동기화 작업을 수행
  async onModuleInit() {
    // 비동기로 실행하여 부팅 속도에 영향을 주지 않음
    /*
    void this.syncPopulationData().catch((err) => {
      console.error('Initial sync failed', err);
    });
    */
    await Promise.resolve();
  }

  // NestJS/Scheduler를 사용해 하루 한번 api와 db 동기화
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    console.log('Starting scheduled daily population sync...');
    await this.syncPopulationData();
  }

  // 서울시 api를 가져와 업데이트, 삽입 동시에 진행
  async syncPopulationData() {
    const SERVICE_NAME = 'Se250MSpopLocalResd';
    const CHUNK_SIZE = 1000;
    const MAX_ITEMS = 19000;

    try {
      this.logger.log('Syncing population data from Seoul API...');
      const chunks: { start: number; end: number }[] = [];
      for (let s = 1; s <= MAX_ITEMS; s += CHUNK_SIZE) {
        chunks.push({ start: s, end: Math.min(s + CHUNK_SIZE - 1, MAX_ITEMS) });
      }

      const allRows: FloatingPopulationRow[] = [];

      await Promise.all(
        chunks.map(async (chunk) => {
          try {
            const url = `${this.baseUrl}/${this.apiKey}/xml/${SERVICE_NAME}/${chunk.start}/${chunk.end}/`;
            const resp = await fetch(url);
            if (!resp.ok) return;

            const xml = await resp.text();
            const parsed = this.parser.parse(xml) as RawSeoulXmlResponse;
            const result = parsed[SERVICE_NAME];

            if (result && 'row' in result) {
              const rows = Array.isArray(result.row)
                ? result.row
                : [result.row];
              rows.forEach((r) => {
                allRows.push(
                  this.cleanRowData(r as unknown as FloatingPopulationRow),
                );
              });
            }
          } catch (e) {
            this.logger.warn(
              `Failed to fetch chunk ${chunk.start}-${chunk.end}`,
              e,
            );
          }
        }),
      );

      this.logger.log(`Fetched ${allRows.length} rows. Deduplicating...`);
      const uniqueMap = new Map<string, FloatingPopulationRow>();
      allRows.forEach((row) => {
        const key = `${row.YMD}_${row.TT}_${row.CELL_ID}`;
        uniqueMap.set(key, row);
      });

      const uniqueRows = Array.from(uniqueMap.values());
      if (uniqueRows.length > 0) {
        await this.repository.upsertPopulation(uniqueRows);
        this.logger.log(
          `Successfully synced ${uniqueRows.length} unique population records.`,
        );
      }
    } catch (error) {
      this.logger.error('Sync process failed', error);
    }
  }

  private cleanRowData(row: FloatingPopulationRow): FloatingPopulationRow {
    const cleaned = { ...row };
    const numericKeys = Object.keys(cleaned).filter(
      (key) => !['H_DNG_CD', 'CELL_ID', 'YMD', 'TT'].includes(key),
    );

    numericKeys.forEach((key) => {
      const val = cleaned[key];
      if (val === '*' || val === '') {
        cleaned[key] = 0;
      } else if (typeof val === 'string') {
        cleaned[key] = Number(val) || 0;
      }
    });

    return cleaned;
  }

  // 특정영역의 유동인구를 조회
  async getCombinedLayerByBounds(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<CombinedLayerResponse> {
    const features = await this.repository.findCombinedLayerByBounds(
      minLat,
      minLng,
      maxLat,
      maxLng,
    );

    const firstPop = features[0]?.population;

    return {
      ymd: firstPop?.YMD || '',
      tt: firstPop?.TT || '',
      features: features,
    };
  }

  // 전체 유동인구 데이터를 조회
  async getPopulationData(
    start: number,
    end: number,
  ): Promise<FloatingPopulationResponse> {
    this.logger.warn(
      `Direct getPopulationData called (start: ${start}, end: ${end}). Returning empty for now or implement DB paging.`,
    );

    return await Promise.resolve({
      list_total_count: 0,
      RESULT: {
        CODE: 'INFO-200',
        MESSAGE:
          'DB 기반 조회로 전환되었습니다. Bounds 기반 조회를 권장합니다.',
      },
      row: [],
    });
  }
}
