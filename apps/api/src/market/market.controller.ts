import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';
import {
  GetMarketAnalysisQueryDto,
  MarketAnalysisResponseDto,
} from './dto/market-analysis.dto';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('analysis')
  getAnalysis(
    @Query() query: GetMarketAnalysisQueryDto,
  ): Promise<MarketAnalysisResponseDto> {
    return this.marketService.getAnalysisData(query);
  }
}
