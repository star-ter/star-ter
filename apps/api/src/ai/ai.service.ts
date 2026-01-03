import { Injectable } from '@nestjs/common';
import {
  analyzeResults,
  embedText,
  getCategoryByMessage,
  getLocationByMessage,
  getText,
  toolCallAi,
} from './openAI/openAI';
import { AiRepository } from './ai.repository';
import { BusinessCategoryVectorDto } from './dto/column-vector';
import { ResponseInputItem } from 'openai/resources/responses/responses.js';
import { ToolsRepository } from './tools.repository';

@Injectable()
export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly toolsRepository: ToolsRepository,
  ) {}

  async getAIMessage(message: string): Promise<string> {
    const [categories, areaList] = await Promise.all([
      this.getCategories(message),
      this.buildAreaList(message),
    ]);
    console.log('전처리 완료 -- AI 도구 호출 시작'); // --- IGNORE ---
    const input: ResponseInputItem[] = [{ role: 'user', content: message }];
    const toolCallResponse = await toolCallAi(message, categories, areaList);
    input.push(...toolCallResponse.output);

    for (const toolCall of toolCallResponse.output) {
      if (toolCall.type !== 'function_call') continue;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const args: Record<string, unknown> = JSON.parse(toolCall.arguments);
      const stdrYyquCd = (args.stdr_yyqu_cd as string | undefined) ?? '20253';
      let output = '';

      switch (toolCall.name) {
        case 'get_store': {
          const areaCd =
            (args.area_cd as string | undefined) ??
            (args.areaCd as string | undefined);
          if (!areaCd) {
            throw new Error('Missing area_cd');
          }
          const result = await this.toolsRepository.getCommercialSummary({
            stdrYyquCd,
            areaCd: String(areaCd),
          });
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        case 'get_foot_traffic': {
          const areaCd =
            (args.area_cd as string | undefined) ??
            (args.areaCd as string | undefined);
          if (!areaCd) {
            throw new Error('Missing area_cd');
          }
          const result = await this.toolsRepository.getFootTrafficSummary({
            stdrYyquCd,
            areaCd: String(areaCd),
          });
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        case 'get_resident_population': {
          const areaCd =
            (args.area_cd as string | undefined) ??
            (args.areaCd as string | undefined);
          if (!areaCd) {
            throw new Error('Missing area_cd');
          }
          const result =
            await this.toolsRepository.getResidentPopulationSummary({
              stdrYyquCd,
              areaCd: String(areaCd),
            });
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        case 'get_working_population': {
          const areaCd =
            (args.area_cd as string | undefined) ??
            (args.areaCd as string | undefined);
          if (!areaCd) {
            throw new Error('Missing area_cd');
          }
          const result = await this.toolsRepository.getWorkingPopulationSummary(
            {
              stdrYyquCd,
              areaCd: String(areaCd),
            },
          );
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        case 'get_sales_top_industries': {
          const areaCd =
            (args.area_cd as string | undefined) ??
            (args.areaCd as string | undefined);
          if (!areaCd) {
            throw new Error('Missing area_cd');
          }
          const result = await this.toolsRepository.getSalesTopIndustries({
            stdrYyquCd,
            areaCd: String(areaCd),
          });
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        case 'get_store_top_industries': {
          const areaCd =
            (args.area_cd as string | undefined) ??
            (args.areaCd as string | undefined);
          if (!areaCd) {
            throw new Error('Missing area_cd');
          }
          const result = await this.toolsRepository.getStoreTopIndustries({
            stdrYyquCd,
            areaCd: String(areaCd),
          });
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        case 'get_income_consumption': {
          const areaCd =
            (args.area_cd as string | undefined) ??
            (args.areaCd as string | undefined);
          if (!areaCd) {
            throw new Error('Missing area_cd');
          }
          const result = await this.toolsRepository.getIncomeConsumptionSummary(
            {
              stdrYyquCd,
              areaCd: String(areaCd),
            },
          );
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        case 'get_commercial_change': {
          const areaCd =
            (args.area_cd as string | undefined) ??
            (args.areaCd as string | undefined);
          if (!areaCd) {
            throw new Error('Missing area_cd');
          }
          const result = await this.toolsRepository.getCommercialChangeSummary({
            stdrYyquCd,
            areaCd: String(areaCd),
          });
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        case 'compare_commercial_areas': {
          const areaCodes =
            (args.area_codes as string[] | undefined) ??
            (args.areaCodes as string[] | undefined);
          if (!Array.isArray(areaCodes) || areaCodes.length === 0) {
            throw new Error('Missing area_codes');
          }
          const result = await this.toolsRepository.compareCommercialAreas({
            stdrYyquCd,
            areaCodes: areaCodes.map((code) => String(code)),
          });
          output = JSON.stringify(result, safeBigIntStringify);
          break;
        }
        default:
          continue;
      }

      input.push({
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: output,
      });
    }
    console.log('도구 호출 완료'); // --- IGNORE ---
    const analyzeResult = await analyzeResults(input);

    return getText(analyzeResult);
  }

  private async buildAreaList(message: string) {
    const areaText = getText(await getLocationByMessage(message));
    if (areaText === '""') return [];
    const messageAreaList = areaText.split(',').map((area) => area.trim());

    const results = await Promise.all(
      messageAreaList.map(async (area) => {
        const areaVector = await embedText(area);
        const [first] = await this.aiRepository.areaSearchByVector(
          areaVector.data[0].embedding,
          1,
        );
        return first;
      }),
    );
    return results;
  }

  private async getCategories(message: string) {
    const categoryResponse = await getCategoryByMessage(message);
    if (getText(categoryResponse) === '""') return [];
    const categories = getText(categoryResponse)
      .split(',')
      .map((cat) => cat.trim());

    let categoryList: BusinessCategoryVectorDto[] = [];
    for (const category of categories) {
      const categoryVector = await embedText(category);
      const categoryResults = await this.aiRepository.categorySearchByVector(
        categoryVector.data[0].embedding,
        5,
      );
      categoryList = categoryList.concat(categoryResults);
    }
    return categoryList;
  }
}

function safeBigIntStringify(key: string, value: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof value === 'bigint' ? value.toString() : value;
}
