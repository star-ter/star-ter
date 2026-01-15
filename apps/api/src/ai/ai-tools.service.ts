import { Injectable } from '@nestjs/common';
import { ToolsRepository } from './tools.repository';
import { QueryParams } from './dto/query-dto';

@Injectable()
export class AiToolsService {
  constructor(private readonly toolsRepository: ToolsRepository) {}

  async run(toolName: string, argsJson: string): Promise<unknown> {
    const args: QueryParams = this.parseArgs(argsJson);
    args.stdrYyquCd = args.stdrYyquCd || '20253';
    switch (toolName) {
      case 'get_store':
        return this.toolsRepository.getCommercialSummary(args);
      case 'get_resident_population':
        return this.toolsRepository.getResidentPopulationSummary(args);
      case 'get_working_population':
        return this.toolsRepository.getWorkingPopulationSummary(args);
      case 'get_sales_top_industries':
        return this.toolsRepository.getSalesTopIndustries(args);
      case 'get_store_top_industries':
        return this.toolsRepository.getStoreTopIndustries(args);
      case 'get_income_consumption':
        return this.toolsRepository.getIncomeConsumptionSummary(args);
      case 'compare_commercial_areas':
        return this.toolsRepository.compareCommercialAreas(args);
      case 'get_industry_commercial_summary':
        return this.toolsRepository.getIndustryCommercialSummary(args);
      case 'recommend_commercial_by_industry':
        return this.toolsRepository.recommendCommercialByIndustry(args);
      case 'compare_commercial_by_industry':
        return this.toolsRepository.compareCommercialByIndustry(args);
      case 'recommend_real_estate':
        return this.toolsRepository.recommendRealEstate(args);
      case 'get_foot_traffic_timeseries':
        return this.toolsRepository.getFootTrafficTimeSeries(args);
      case 'get_foot_traffic_detail':
        return this.toolsRepository.getFootTrafficDetail(args);
      case 'get_competition_analysis':
        return this.toolsRepository.getCompetitionAnalysis(args);
      case 'get_commercial_risk':
        return this.toolsRepository.getCommercialRisk(args);
      case 'estimate_revenue_and_cost':
        return this.toolsRepository.estimateRevenueAndCost(args);
      case 'calc_break_even':
        return this.toolsRepository.calcBreakEven(args);
      case 'predict_survival_rate':
        return this.toolsRepository.predictSurvivalRate(args);
      case 'get_funding_programs':
        return this.toolsRepository.getFundingPrograms(args);
      case 'request_report_generation':
        return this.toolsRepository.requestReportGeneration(args);
      case 'calc_break_even_with_listing':
        return this.toolsRepository.calcBreakEvenWithListing(args);
      case 'find_similar_commercial_areas':
        return this.toolsRepository.findSimilarCommercialAreas(args);
      default:
        return undefined;
    }
  }

  private parseArgs(argsJson: string): QueryParams {
    try {
      const parsed = JSON.parse(argsJson) as QueryParams;

      return parsed || {};
    } catch {
      return {} as QueryParams;
    }
  }
}
