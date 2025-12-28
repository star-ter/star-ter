import { Controller, Post, Body } from '@nestjs/common';
import { CommercialAreaService } from './commercial-area.service';
import { ComparisonRequestDto } from './dto/comparison-request.dto';
import { AreaComparisonResponse } from './dto/area-comparison.dto';

@Controller('commercial-area')
export class CommercialAreaController {
  constructor(private readonly commercialAreaService: CommercialAreaService) {}

  /**
   * 두 상권 비교 API
   * POST /api/commercial-area/compare
   */
  @Post('compare')
  async compareAreas(
    @Body() dto: ComparisonRequestDto,
  ): Promise<AreaComparisonResponse> {
    return this.commercialAreaService.compareAreas(dto);
  }

  // TODO: 추가 엔드포인트 구현
  // @Get()
  // async getAreaList() { ... }

  // @Get(':areaCode')
  // async getAreaDetail(@Param('areaCode') areaCode: string) { ... }

  // @Get(':areaCode/stores')
  // async getStoresByCategory(@Param('areaCode') areaCode: string) { ... }

  // @Get(':areaCode/sales')
  // async getSalesByCategory(@Param('areaCode') areaCode: string) { ... }
}
