import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { GeoJsonGeometry } from './dto/floating-population-response.dto';

export interface GridCellGeometry {
  cell_id: string;
  geometry: GeoJsonGeometry;
}

interface GridCellRawResult {
  cell_id: string;
  geometry: string; // ST_AsGeoJSON returns a JSON string
}

@Injectable()
export class FloatingPopulationRepository {
  private readonly logger = new Logger(FloatingPopulationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * cell_id 리스트에 해당하는 격자 정보를 DB에서 조회합니다.
   * ST_AsGeoJSON을 사용하여 geometry를 GeoJSON 문자열로 변환하여 가져옵니다.
   */
  async findGridCellsByIds(cellIds: string[]): Promise<GridCellGeometry[]> {
    if (!cellIds || cellIds.length === 0) {
      return [];
    }

    try {
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
    } catch (error) {
      this.logger.error('Failed to fetch grid cells', error);
      throw error;
    }
  }

  /**
   * 특정 영역(Bounds) 내의 격자 정보를 조회합니다.
   * ST_Intersects와 ST_MakeEnvelope를 사용하여 공간 검색을 수행합니다.
   */
  async findGridCellsByBounds(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ): Promise<GridCellGeometry[]> {
    try {
      // 4326: WGS 84 (GPS 좌표계)
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
    } catch (error) {
      this.logger.error('Failed to fetch grid cells by bounds', error);
      throw error;
    }
  }

  /**
   * 모든 격자 데이터를 조회합니다 (디버깅/전체 로드용)
   */
  async findAllGridCells(): Promise<GridCellGeometry[]> {
    const query = `
    SELECT 
        cell_id, 
        ST_AsGeoJSON(geom) as geometry
    FROM "seoul_250_grid"
    `;

    const result =
      await this.prisma.$queryRawUnsafe<GridCellRawResult[]>(query);

    return result.map((row) => ({
      cell_id: row.cell_id,
      geometry: JSON.parse(row.geometry) as GeoJsonGeometry,
    }));
  }
}
