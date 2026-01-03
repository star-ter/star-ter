import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import {
  GetSummaryReportQueryDto,
  SummaryReportResponse,
} from './dto/summary-report.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  async getSummaryReport(
    @Query() query: GetSummaryReportQueryDto,
  ): Promise<SummaryReportResponse> {
    return this.reportService.getSummaryReport(
      query.regionCode,
      query.industryCode,
      query.industryName,
      query.regionName,
    );
  }
}
