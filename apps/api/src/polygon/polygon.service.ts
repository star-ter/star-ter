import { Injectable } from '@nestjs/common';
import { polygonBuildingMock } from './mock/polygon-building-mock';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PolygonService {
  constructor(private readonly prisma: PrismaService) {}

  getAdminPolygonByLowSearch(lowSearch: number) {
    if (lowSearch == 2) {
      return this.prisma.admin_area_dong.findMany();
    }
    return this.prisma.admin_area_gu.findMany();
  }

  getBuildingPolygon() {
    return polygonBuildingMock;
  }
}
