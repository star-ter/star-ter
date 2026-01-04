import { Injectable } from '@nestjs/common';
import { ToolsRepository } from './tools.repository';
import { QueryParams } from './dto/query-dto';

@Injectable()
export class AiToolsService {
  constructor(private readonly toolsRepository: ToolsRepository) {}

  async run(toolName: string, argsJson: string): Promise<any> {
    const args: QueryParams = this.parseArgs(argsJson);
    args.stdrYyquCd = args.stdrYyquCd || '20253';
    switch (toolName) {
      case 'get_store':
        return this.toolsRepository.getCommercialSummary(args);
      case 'get_foot_traffic':
        return this.toolsRepository.getFootTrafficSummary(args);
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
      case 'get_commercial_change':
        return this.toolsRepository.getCommercialChangeSummary(args);
      case 'compare_commercial_areas':
        return this.toolsRepository.compareCommercialAreas(args);
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
