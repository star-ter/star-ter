import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AreaVectorDto, BusinessCategoryVectorDto } from '../dto/column-vector';
import { ResponseInput, Tool } from 'openai/resources/responses/responses.js';
import { TOOLS } from '../tools/definitions';
import { FINAL_RESPONSE_SCHEMA_FOR_ACTION } from '../schemas/response-schemas';
import { PROMPTS } from '../constants/prompts';

@Injectable()
export class OpenAiService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI();
  }

  getText(response: OpenAI.Responses.Response): string {
    return response?.output_text || '';
  }

  embedText(text: string) {
    return this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
  }

  getCategoryByMessage(message: string) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      input: message,
      temperature: 0,
      instructions: PROMPTS.CATEGORY_EXTRACTION,
    });
  }

  getLocationByMessage(message: string) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      input: message,
      temperature: 0,
      instructions: PROMPTS.LOCATION_EXTRACTION,
    });
  }

  toolCallAi(
    input: ResponseInput,
    categories: BusinessCategoryVectorDto[],
    areaList: AreaVectorDto[],
  ) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      input: input,
      service_tier: 'priority',
      tools: TOOLS as Array<Tool>,
      instructions: PROMPTS.TOOL_CALL_SYSTEM.replace(
        '${categoryVectors}',
        this.formatCategoryVectors(categories),
      ).replace('${areaVectors}', this.formatAreaVectors(areaList)),
    });
  }

  analyzeResults(input: ResponseInput) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      input: input,
      service_tier: 'priority',
      max_output_tokens: 10000,
      text: {
        format: FINAL_RESPONSE_SCHEMA_FOR_ACTION,
      },
      instructions: PROMPTS.ANALYZE_RESULTS_SYSTEM,
    });
  }

  getTablesByMessage(message: string) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      input: message,
      instructions: PROMPTS.GET_TABLES,
    });
  }

  // Private helper methods
  private formatAreaVectors(areas: AreaVectorDto[]): string {
    return areas
      .map(
        (area) =>
          `area_name: ${area.areaName}, area_level: ${area.areaLevel}, area_code: ${area.areaCode}, lat: ${area.lat || 'null'}, lng: ${area.lng || 'null'}`,
      )
      .join('\n');
  }

  private formatCategoryVectors(
    categories: BusinessCategoryVectorDto[],
  ): string {
    return categories
      .map(
        (cat) =>
          `svc_induty_cd: ${cat.code}, svc_induty_cd_nm: ${cat.categoryName}`,
      )
      .join('\n');
  }
}
