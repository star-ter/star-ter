import { Injectable } from '@nestjs/common';
import { OpenAiService } from './openAI/open-ai.service';
import { AiRepository } from './ai.repository';
import { BusinessCategoryVectorDto } from './dto/column-vector';
import { ResponseInputItem } from 'openai/resources/responses/responses.js';
import { AiToolsService } from './ai-tools.service';
import { AiResponseProcessor } from './ai-response.processor';

@Injectable()
export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly aiToolsService: AiToolsService,
    private readonly aiResponseProcessor: AiResponseProcessor,
    private readonly openAiService: OpenAiService,
  ) {}

  // 대화 히스토리 포함 메시지 처리 함수 (꼬리 질문 지원)
  private readonly MAX_HISTORY_LENGTH = 10;
  // [DEBUG] 히스토리 기능 on/off 플래그 - 시연용으로 끌 수 있음
  private readonly ENABLE_HISTORY = true; // true로 변경하면 히스토리 활성화

  async getAIMessageWithHistory(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const [categories, areaList] = await Promise.all([
      this.getCategories(message),
      this.getAreaInfo(message),
    ]);

    // 입력 배열 구성 (히스토리 포함)
    const input: ResponseInputItem[] = [];

    // 이전 대화 히스토리 추가 (ENABLE_HISTORY가 true일 때만)
    if (this.ENABLE_HISTORY && history && history.length > 0) {
      const recentHistory = history.slice(-this.MAX_HISTORY_LENGTH);
      for (const msg of recentHistory) {
        input.push({
          role: msg.role,
          content: msg.content,
        });
      }
      console.log(
        `[AiService] History enabled: ${recentHistory.length} messages added`,
      );
    } else if (!this.ENABLE_HISTORY) {
      console.log('[AiService] History disabled - using single message mode');
    }

    // 현재 사용자 메시지 추가
    input.push({ role: 'user', content: message });

    const toolCallResponse = await this.openAiService.toolCallAi(
      input,
      categories,
      areaList,
    );
    console.log(
      '[AiService] Tool call response:',
      JSON.stringify(toolCallResponse.output, null, 2),
    );
    input.push(...toolCallResponse.output);

    for (const toolCall of toolCallResponse.output) {
      if (toolCall.type !== 'function_call') continue;
      const toolResult = await this.aiToolsService.run(
        toolCall.name,
        toolCall.arguments,
      );

      if (toolResult === undefined) {
        continue;
      }

      input.push({
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify(toolResult, (k, v) =>
          this.aiResponseProcessor.safeBigIntStringify(k, v),
        ),
      });
    }

    // [Fix] Track if break-even tool was called to ensure action generation
    const breakEvenContext = toolCallResponse.output.reduce(
      (acc, toolCall) => {
        if (acc) return acc; // already found
        if (toolCall.type !== 'function_call') return acc;

        try {
          if (toolCall.name === 'calc_break_even_with_listing') {
            const args = JSON.parse(toolCall.arguments) as {
              listingId?: string;
              categoryCode?: string;
            };
            if (args.listingId)
              return {
                type: 'listing' as const,
                id: args.listingId,
                categoryCode: args.categoryCode,
              };
          } else if (toolCall.name === 'calc_break_even') {
            const args = JSON.parse(toolCall.arguments) as {
              areaCd?: string;
              categoryCode?: string;
            };
            if (args.areaCd)
              return {
                type: 'area' as const,
                id: args.areaCd,
                categoryCode: args.categoryCode,
              };
          }
        } catch (e) {
          console.warn(
            '[AiService] Failed to parse tool arguments for BEP context:',
            e,
          );
        }
        return acc;
      },
      null as {
        type: 'listing' | 'area';
        id: string;
        categoryCode?: string;
      } | null,
    );

    console.log('[AiService] Calling analyzeResults...');
    const analyzeResult = await this.openAiService.analyzeResults(input);

    const responseText = this.openAiService.getText(analyzeResult);
    console.log('[AI Response]', responseText);

    // Use processor for parsing and patching
    const parsedResponse = this.aiResponseProcessor.parseResponse(responseText);

    // [Fix] Force inject chart.breakeven action if missing
    if (breakEvenContext) {
      parsedResponse.actions = parsedResponse.actions || [];
      const hasAction = parsedResponse.actions.some(
        (a) => a.type === 'chart.breakeven',
      );

      if (!hasAction) {
        console.log(
          '[AiService] Force injecting missing chart.breakeven action for',
          breakEvenContext,
        );
        parsedResponse.actions.push({
          type: 'chart.breakeven',
          payload:
            breakEvenContext.type === 'listing'
              ? {
                  listingId: breakEvenContext.id,
                  industryCode: breakEvenContext.categoryCode,
                }
              : {
                  areaCode: breakEvenContext.id,
                  industryCode: breakEvenContext.categoryCode,
                },
        });
      }
    }
    const finalJson = this.aiResponseProcessor.patchCoordinates(
      parsedResponse,
      areaList,
    );

    return finalJson;
  }

  async getAreaInfo(message: string) {
    const areaText = this.openAiService.getText(
      await this.openAiService.getLocationByMessage(message),
    );
    if (areaText === '""') return [];
    const messageAreaList = areaText.split(',').map((area) => area.trim());

    const DISTANCE_THRESHOLD = 0.4; // 벡터 검색 신뢰도 임계값

    const results = await Promise.all(
      messageAreaList.map(async (area) => {
        const areaVector = await this.openAiService.embedText(area);
        const vectorCandidates = await this.aiRepository.areaSearchByVector(
          areaVector.data[0].embedding,
          3,
        );

        console.log(
          `[DEBUG] Vector search for "${area}":`,
          vectorCandidates.map((c) => `${c.areaName} (dist: ${c.distance})`),
        );

        // 신뢰도 체크: 최상위 결과의 distance가 임계값 초과하면 fallback
        let finalCandidates = vectorCandidates;
        if (
          vectorCandidates.length === 0 ||
          Number(vectorCandidates[0].distance) > DISTANCE_THRESHOLD
        ) {
          console.log(
            `[DEBUG] Vector search unreliable (dist > ${DISTANCE_THRESHOLD}), trying text fallback...`,
          );
          const textCandidates = await this.aiRepository.areaSearchByText(
            area,
            3,
          );
          if (textCandidates.length > 0) {
            // 텍스트 검색 결과 우선, 벡터 결과 병합 (중복 제거)
            const seenCodes = new Set(textCandidates.map((c) => c.areaCode));
            const mergedCandidates = [
              ...textCandidates,
              ...vectorCandidates.filter((c) => !seenCodes.has(c.areaCode)),
            ];
            finalCandidates = mergedCandidates.slice(0, 3);
            console.log('[DEBUG] Using text search results:', finalCandidates);
          }
        }

        // 좌표 추가
        const candidatesWithCoords = await Promise.all(
          finalCandidates.map(async (candidate) => {
            const coords = await this.aiRepository.getAreaCoordinates(
              candidate.areaCode,
              candidate.areaLevel,
            );
            if (coords) {
              candidate.lat = coords.lat;
              candidate.lng = coords.lng;
            }
            return candidate;
          }),
        );

        return candidatesWithCoords;
      }),
    );

    return results
      .flat()
      .filter((item): item is NonNullable<typeof item> => !!item);
  }

  async getCategories(message: string) {
    const categoryResponse =
      await this.openAiService.getCategoryByMessage(message);
    const categoryText = this.openAiService.getText(categoryResponse);
    console.log(
      `[DEBUG] Extracted Categories for message "${message}":`,
      categoryText,
    );

    if (categoryText === '""') return [];

    const categories = categoryText.split(',').map((cat) => cat.trim());

    let categoryList: BusinessCategoryVectorDto[] = [];
    for (const category of categories) {
      const categoryVector = await this.openAiService.embedText(category);
      console.log(`[DEBUG] Embedding for ${category} generated.`);

      const categoryResults = await this.aiRepository.categorySearchByVector(
        categoryVector.data[0].embedding,
        3,
      );
      console.log(
        `[DEBUG] Vector Search Results for "${category}":`,
        JSON.stringify(categoryResults, null, 2),
      );

      categoryList = categoryList.concat(categoryResults);
    }
    return categoryList;
  }
}
