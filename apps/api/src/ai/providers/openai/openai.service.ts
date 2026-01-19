import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  AreaVectorDto,
  BusinessCategoryVectorDto,
} from '../../dto/column-vector';
import { ResponseInput, Tool } from 'openai/resources/responses/responses.js';
import { TOOLS } from '../../tools/definitions';
import { PROMPTS } from '../../prompts/openai-prompts';
import { initValkeySemanticCache } from '../../cache/valkey.client';
import { semanticGetByVec, semanticSetByVec } from '../../cache/semantic-cache';

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
      parallel_tool_calls: true,
      tools: TOOLS as Array<Tool>,
      instructions: PROMPTS.TOOL_CALL_SYSTEM.replace(
        '${categoryVectors}',
        this.formatCategoryVectors(categories),
      ).replace('${areaVectors}', this.formatAreaVectors(areaList)),
    });
  }

  analyzeResults(input: ResponseInput) {
    return this.client.responses.create({
      model: 'gpt-4o-mini',
      input: input,
      service_tier: 'priority',
      max_output_tokens: 10000,
      instructions: PROMPTS.ANALYZE_RESULTS_SYSTEM,
    });
  }

  async streamAnalyzeResults(
    input: ResponseInput,
    onDelta: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const stream = await this.client.responses.create(
      {
        model: 'gpt-4o-mini',
        input: input,
        service_tier: 'priority',
        max_output_tokens: 10000,
        instructions: PROMPTS.ANALYZE_RESULTS_SYSTEM,
        stream: true,
      },
      signal ? { signal } : undefined,
    );

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        const delta = event.delta ?? '';
        if (delta) {
          onDelta(delta);
          fullText += delta;
        }
      }
    }

    return fullText;
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

  /**
   * LLM 결과를 벡터 캐시에 저장하고 재사용하는 유틸리티 함수
   * ex)
   * getTestResponse(message: string) {
   *   return this.llmSemanticCache(message, async () => {
   *     const response = await this.client.responses.create({
   *       model: 'gpt-4.1-mini',
   *       input: message,
   *     });
   *     return this.getText(response);
   *   });
   * }
   * @param text llm input text
   * @param llmFunction llm 실행 함수
   * @returns {response: string, hit: boolean} 캐시된 값 또는 LLM 결과
   */
  private async llmSemanticCache(
    text: string,
    llmFunction: () => Promise<string>,
  ) {
    const client = await initValkeySemanticCache();
    const vec = (await this.embedText(text)).data[0].embedding;

    const cached = await semanticGetByVec(client, vec, 1);
    if (cached != null) {
      return { value: String(cached), hit: true };
    }

    const value = await llmFunction();
    await semanticSetByVec(client, text, vec, JSON.stringify(value), 300);

    return { response: value, hit: false };
  }
}
