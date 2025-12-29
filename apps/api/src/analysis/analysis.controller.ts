
import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('search')
  searchRegions(@Query('query') query: string) {
    return this.analysisService.searchRegions(query);
  }

  @Get(':regionCode')
  getAnalysis(@Param('regionCode') regionCode: string) {
    return this.analysisService.getAnalysis(regionCode);
  }
}
