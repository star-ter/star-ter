import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GeoAreaListResponseDto,
  GeoGuResponseDto,
  GetGeoDongListQueryDto,
  GetGeoGuListQueryDto,
  GetGeoGuQueryDto,
} from './dto/geo.dto';

type GeoRow = {
  signgu_cd: string;
  signgu_cd_: string;
  adstrd_cd: string;
  adstrd_cd_: string;
};

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async getGuByPoint(
    query: GetGeoGuQueryDto,
  ): Promise<GeoGuResponseDto | null> {
    const lat = Number(query.lat);
    const lng = Number(query.lng);

    const rows = await this.prisma.$queryRaw<GeoRow[]>`
      SELECT signgu_cd, signgu_cd_, adstrd_cd, adstrd_cd_
      FROM seoul_commercial_area_grid
      WHERE ST_Contains(
        geom,
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
      )
      LIMIT 1
    `;

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return {
      signguCode: row.signgu_cd,
      signguName: row.signgu_cd_,
      adstrdCode: row.adstrd_cd,
      adstrdName: row.adstrd_cd_,
    };
  }

  async getGuList(
    query: GetGeoGuListQueryDto,
  ): Promise<GeoAreaListResponseDto> {
    const cityCode = query.cityCode || '11';
    const rows = await this.prisma.areaGu.findMany({
      where: cityCode ? { SIGNGU_CD: { startsWith: cityCode } } : undefined,
      select: { SIGNGU_CD: true, SIGNGU_NM: true },
      orderBy: { SIGNGU_NM: 'asc' },
    });

    return {
      items: rows.map((row) => ({
        code: row.SIGNGU_CD,
        name: row.SIGNGU_NM,
      })),
    };
  }

  async getDongList(
    query: GetGeoDongListQueryDto,
  ): Promise<GeoAreaListResponseDto> {
    const rows = await this.prisma.areaDong.findMany({
      where: { ADSTRD_CD: { startsWith: query.guCode } },
      select: { ADSTRD_CD: true, ADSTRD_NM: true },
      orderBy: { ADSTRD_NM: 'asc' },
    });

    return {
      items: rows.map((row) => ({
        code: row.ADSTRD_CD,
        name: row.ADSTRD_NM,
      })),
    };
  }
}
