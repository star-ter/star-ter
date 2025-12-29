import { Controller, Get, Query } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import {
  GetRevenueQueryDto,
  GetRevenueRankingQueryDto,
  RevenueRankingResponseDto,
  RevenueResponseDto,
} from './dto/revenue.dto';

@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  getRevenue(@Query() query: GetRevenueQueryDto): Promise<RevenueResponseDto> {
    return this.revenueService.getRevenue(query);
  }

  @Get('ranking')
  getRevenueRanking(
    @Query() query: GetRevenueRankingQueryDto,
  ): Promise<RevenueRankingResponseDto> {
    return this.revenueService.getRevenueRanking(query);
  }
}
