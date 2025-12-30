import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ResolveNavigationDto } from './dto/resolve-navigation.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveNavigation(dto: ResolveNavigationDto) {
    const query = dto.place_query?.trim();
    if (!query) throw new BadRequestException('Query cannot be empty');
    const searchKeyword = `%${query}%`;

    const searchCommercial = async () => {
      const sql = `
        SELECT
          ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint("XCNTS_VALUE", "YDNTS_VALUE"), 5181), 4326)) AS lat,
          ST_X(ST_Transform(ST_SetSRID(ST_MakePoint("XCNTS_VALUE", "YDNTS_VALUE"), 5181), 4326)) AS lng
        FROM area_commercial
        WHERE REPLACE("TRDAR_CD_NM", ' ', '') ILIKE REPLACE($1, ' ', '')
        ORDER BY (CASE WHEN "TRDAR_CD_NM" LIKE '%번%' THEN 1 ELSE 0 END) ASC, length("TRDAR_CD_NM") ASC
        LIMIT 1
      `;
      try {
        const res = await this.prisma.$queryRawUnsafe<any[]>(
          sql,
          searchKeyword,
        );
        if (res && res.length > 0)
          return { lat: res[0].lat, lng: res[0].lng, zoom: 3 };
      } catch (e) {
        console.warn('Commercial search failed:', e);
      }
      return null;
    };

    const searchDong = async () => {
      const sql = `
        SELECT
          ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(x, y), 5179), 4326)) AS lat,
          ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(x, y), 5179), 4326)) AS lng
        FROM admin_area_dong
        WHERE REPLACE(adm_nm, ' ', '') ILIKE REPLACE($1, ' ', '')
        ORDER BY length(adm_nm) ASC
        LIMIT 1
      `;
      try {
        const res = await this.prisma.$queryRawUnsafe<any[]>(
          sql,
          searchKeyword,
        );
        if (res && res.length > 0)
          return { lat: res[0].lat, lng: res[0].lng, zoom: 5 };
      } catch (e) {
        console.warn('Dong search failed:', e);
      }
      return null;
    };

    const searchGu = async () => {
      const sql = `
        SELECT
          ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(x, y), 5179), 4326)) AS lat,
          ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(x, y), 5179), 4326)) AS lng
        FROM admin_area_gu
        WHERE REPLACE(adm_nm, ' ', '') ILIKE REPLACE($1, ' ', '')
        ORDER BY length(adm_nm) ASC
        LIMIT 1
      `;
      try {
        const res = await this.prisma.$queryRawUnsafe<any[]>(
          sql,
          searchKeyword,
        );
        if (res && res.length > 0)
          return { lat: res[0].lat, lng: res[0].lng, zoom: 7 };
      } catch (e) {
        console.warn('Gu search failed:', e);
      }
      return null;
    };

    // Priority Handling based on suffix
    let result: any = null;

    if (query.endsWith('구')) {
      // Priority: Gu -> Dong -> Commercial
      result = await searchGu();
      if (!result) result = await searchDong();
      if (!result) result = await searchCommercial();
    } else if (query.endsWith('동')) {
      // Priority: Dong -> Gu -> Commercial
      result = await searchDong();
      if (!result) result = await searchGu(); // Maybe 'Dong' search fail but exists as Gu? Unlikely but safe.
      if (!result) result = await searchCommercial();
    } else {
      // Default Priority: Commercial -> Dong -> Gu
      result = await searchCommercial();
      if (!result) result = await searchDong();
      if (!result) result = await searchGu();
    }

    if (result) return result;
    throw new NotFoundException('Location not found');
  }
}
