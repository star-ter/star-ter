import { PrismaService } from 'src/prisma/prisma.service';
import {
  AreaVectorDto,
  BusinessCategoryVectorDto,
  ColumnVectorDto,
} from './dto/column-vector';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async columnsSearchByVector(
    vector: number[],
    limit: number,
  ): Promise<ColumnVectorDto[]> {
    const vectorLiteral = this.toVectorLiteral(vector);

    const rows = await this.prisma.$queryRaw<ColumnVectorDto[]>`
      SELECT
        question,
        description,
        table_name AS "tableName",
        column_name AS "columnName",
        data_type AS "dataType",
        embedding <=> ${vectorLiteral}::vector AS distance
      FROM column_vector_table
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `;
    return rows;
  }

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
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `;
    return rows;
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

  async runSql(sql: string): Promise<any[]> {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql);
    return rows;
  }
}
