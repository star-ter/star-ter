import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';
import {
  GetMarketAnalysisQueryDto,
  MarketStoreListDto,
  GetBuildingStoreQueryDto,
  BuildingStoreCountDto,
} from './dto/market-store.dto';
import { MarketAnalyticsDto } from './dto/market-analytics.dto';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('stores')
  getStoreList(
    @Query() query: GetMarketAnalysisQueryDto,
  ): Promise<MarketStoreListDto> {
    return this.marketService.getStoreList(query);
  }

  @Get('building-stores')
  getBuildingStoreCounts(
    @Query() query: GetBuildingStoreQueryDto,
  ): Promise<BuildingStoreCountDto[]> {
    return this.marketService.getBuildingStoreCounts(query);
  }

  @Get('analytics')
  getAnalytics(
    @Query() query: GetMarketAnalysisQueryDto,
  ): Promise<MarketAnalyticsDto> {
    return this.marketService.getAnalytics(query);
  }
}
