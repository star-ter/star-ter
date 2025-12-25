import { Controller, Get, Query } from '@nestjs/common';
import { PolygonService } from './polygon.service';
import { GetPolygonDto, PolygonResponseDto } from './dto/polygon-dto';

@Controller('polygon')
export class PolygonController {
  constructor(private readonly polygonService: PolygonService) {}

  @Get('mock')
  getMockData(@Query() query: GetPolygonDto): PolygonResponseDto {
    return this.polygonService.getMockData(
      query.low_search ? Number(query.low_search) : undefined,
    );
  }

  @Get('mock/building')
  getMockBuildingData() {
    return this.polygonService.getMockBuildingData();
  }
}
