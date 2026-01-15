import { PrismaService } from 'src/prisma/prisma.service';
import { AreaVectorDto, BusinessCategoryVectorDto } from './dto/column-vector';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async categorySearchByVector(
    vector: number[],
    limit: number,
  ): Promise<BusinessCategoryVectorDto[]> {
    const vectorLiteral = this.toVectorLiteral(vector);

    const rows = await this.prisma.$queryRaw<BusinessCategoryVectorDto[]>`
      SELECT
        code,
        category_name AS "categoryName",
        MIN(embedding <=> ${vectorLiteral}::vector) AS distance
      FROM business_category_vector_table
      GROUP BY code, category_name
      ORDER BY MIN(embedding <=> ${vectorLiteral}::vector)
      LIMIT ${limit}
    `;
    return rows;
  }

  async areaSearchByVector(
    vector: number[],
    limit: number,
  ): Promise<AreaVectorDto[]> {
    const vectorLiteral = this.toVectorLiteral(vector);

    const rows = await this.prisma.$queryRaw<AreaVectorDto[]>`
      SELECT
        area_name AS "areaName",
        area_level AS "areaLevel",
        area_code AS "areaCode",
        embedding <=> ${vectorLiteral}::vector AS distance
      FROM area_vector_table
      WHERE area_level = 'commercial'
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `;
    return rows;
  }

  // Fallback: pg_trgm 유사도 기반 텍스트 검색 (벡터 검색 신뢰도 낮을 때 사용)
  async areaSearchByText(
    query: string,
    limit: number,
  ): Promise<AreaVectorDto[]> {
    const rows = await this.prisma.$queryRaw<AreaVectorDto[]>`
      SELECT
        area_name AS "areaName",
        area_level AS "areaLevel",
        area_code AS "areaCode",
        similarity(area_name, ${query}) AS distance
      FROM area_vector_table
      WHERE area_level = 'commercial'
        AND similarity(area_name, ${query}) > 0.3
      ORDER BY similarity(area_name, ${query}) DESC
      LIMIT ${limit}
    `;
    console.log(`[DEBUG] pg_trgm search for "${query}":`, rows);
    return rows;
  }

  async runSql(sql: string): Promise<unknown[]> {
    const rows = await this.prisma.$queryRawUnsafe<unknown[]>(sql);
    return rows;
  }

  async getAreaCoordinates(
    areaCode: string,
    areaLevel: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const level = areaLevel.toLowerCase();
      console.log(
        `[DEBUG] getAreaCoordinates called with code=${areaCode}, level=${level}`,
      );

      let rows: { x: number; y: number }[] = [];

      if (level === 'commercial') {
        const result = await this.prisma.$queryRaw<{ x: number; y: number }[]>`
          SELECT ST_X(ST_Centroid(ST_Transform(geom, 4326))) as x,
                 ST_Y(ST_Centroid(ST_Transform(geom, 4326))) as y
          FROM seoul_commercial_area_grid
          WHERE trdar_cd = ${areaCode}
        `;
        rows = result;
      } else if (level === 'gu') {
        // admin_area_gu table has x, y columns directly
        const result = await this.prisma.adminAreaGu.findFirst({
          where: { signgu_cd: areaCode },
          select: { x: true, y: true },
        });
        if (result) rows = [result];
      } else if (level === 'dong') {
        // admin_area_dong table has x, y columns directly
        const result = await this.prisma.adminAreaDong.findFirst({
          where: { adstrd_cd: areaCode },
          select: { x: true, y: true },
        });
        if (result) rows = [result];
      }

      console.log(`[DEBUG] getAreaCoordinates result count: ${rows.length}`);
      return rows[0] ? { lat: rows[0].y, lng: rows[0].x } : null;
    } catch (error) {
      console.error('Failed to fetch area coordinates:', error);
      return null;
    }
  }

  private toVectorLiteral(vector: number[]): string {
    const normalized = vector.map((value) => {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) {
        throw new Error('Invalid vector value.');
      }
      return numberValue;
    });
    return `[${normalized.join(',')}]`;
  }
}
