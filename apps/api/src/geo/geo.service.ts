import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoGuResponseDto, GetGeoGuQueryDto } from './dto/geo.dto';

type GeoRow = {
  signgu_cd: string;
  signgu_cd_: string;
  adstrd_cd: string;
  adstrd_cd_: string;
};

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async getGuByPoint(query: GetGeoGuQueryDto): Promise<GeoGuResponseDto> {
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
      throw new NotFoundException('해당 좌표에 대한 구/동 정보를 찾을 수 없습니다.');
    }

    const row = rows[0];
    return {
      signguCode: row.signgu_cd,
      signguName: row.signgu_cd_,
      adstrdCode: row.adstrd_cd,
      adstrdName: row.adstrd_cd_,
    };
  }
}
