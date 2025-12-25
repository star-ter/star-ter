import { Injectable } from '@nestjs/common';

import { polygonGuMock } from './mock/polygon-gu-mock';
import { polygonDongMock } from './mock/polygon-dong-mock';
import { polygonBuildingMock } from './mock/polygon-building-mock';

@Injectable()
export class PolygonService {
  getMockData(lowSearch?: number) {
    if (lowSearch == 2) {
      return polygonDongMock;
    }
    return polygonGuMock;
  }

  getMockBuildingData() {
    return polygonBuildingMock;
  }
}
