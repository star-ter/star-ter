import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import {
  FloatingPopulationResponse,
  FloatingPopulationRow,
  RawSeoulXmlResponse,
} from './dto/floating-population-response.dto';

@Injectable()
export class FloatingPopulationService {
  private readonly logger = new Logger(FloatingPopulationService.name);
  private readonly apiKey: string;
  // 서울시 공공데이터포털 API(필수)
  private readonly baseUrl = 'http://openapi.seoul.go.kr:8088';
  private readonly parser = new XMLParser();

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('SEOUL_OPEN_API_KEY') || 'sample';
  }

  async getPopulationData(
    start: number,
    end: number,
  ): Promise<FloatingPopulationResponse> {
    const SERVICE_NAME = 'Se250MSpopLocalResd';
    const CHUNK_SIZE = 1000;

    // 요청 범위를 1000건씩 나누기
    const chunks: { start: number; end: number }[] = [];
    for (let s = start; s <= end; s += CHUNK_SIZE) {
      const e = Math.min(s + CHUNK_SIZE - 1, end);
      if (s <= end) chunks.push({ start: s, end: e });
    }

    try {
      let totalCount = 0;

      // 여러 청크를 병렬로 호출합니다.
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

      // 데이터 병합 및 CELL_ID 기준으로 합산
      const cellMap = new Map<string, FloatingPopulationRow>();

      chunkResults.forEach((rows) => {
        if (!rows) return;
        rows.forEach((row) => {
          if (!cellMap.has(row.CELL_ID)) {
            cellMap.set(row.CELL_ID, { ...row });
          } else {
            const existing = cellMap.get(row.CELL_ID)!;
            // 인구수 합산
            existing.SPOP += row.SPOP;
            // 연령별/성별도 합산
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
      this.logger.log(
        `Aggregated ${finalRows.length} unique cells from raw rows.`,
      );

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

  // 10세 단위로 데이터를 합산
  private cleanRowData(row: FloatingPopulationRow): FloatingPopulationRow {
    const cleaned = { ...row };
    const keys = Object.keys(cleaned) as Array<keyof FloatingPopulationRow>;

    for (const key of keys) {
      const value = cleaned[key];
      // *는 계산이 안되므로 0으로 환산
      if (value === ('*' as unknown)) {
        (cleaned as Record<string, unknown>)[key] = 0;
      }
      // 숫자형태의 문자열은 진짜 숫자로 변환
      else if (
        typeof value === 'string' &&
        !isNaN(Number(value)) &&
        !['H_DNG_CD', 'CELL_ID', 'YMD', 'TT'].includes(key)
      ) {
        (cleaned as Record<string, unknown>)[key] = Number(value);
      }
    }

    const getVal = (key: keyof FloatingPopulationRow) =>
      Number(cleaned[key]) || 0;
    // 10세 단위로 합산
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
