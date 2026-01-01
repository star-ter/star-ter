import { PrismaService } from 'src/prisma/prisma.service';
import { ColumnVectorDto } from './dto/column-vector';
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
        text,
        domain,
        area_level AS "areaLevel",
        table_name AS "tableName",
        column_name AS "columnName",
        data_type AS "dataType",
        embedding <=> ${vectorLiteral}::vector AS distance
      FROM column_vector_table
      ORDER BY embedding <-> ${vectorLiteral}::vector
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
