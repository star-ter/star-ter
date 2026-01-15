import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('search')
  searchRegions(@Query('query') query: string) {
    return this.analysisService.searchRegions(query);
  }

  @Get('search/industry')
  searchIndustries(@Query('query') query: string) {
    return this.analysisService.searchIndustries(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('revenue-cost')
  async getRevenueAndCost(
    @Request() req: { user?: { id: string } },
    @Query('trdar_cd') trdarCd: string,
  ) {
    const userId = req.user?.id;
    return this.analysisService.getRevenueAndCost(trdarCd, userId);
  }

  @Get(':regionCode')
  getAnalysis(@Param('regionCode') regionCode: string) {
    return this.analysisService.getAnalysis(regionCode);
  }
}
