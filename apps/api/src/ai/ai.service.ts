import { Injectable } from '@nestjs/common';
import { AiRepository } from './ai.repository';
import { BusinessCategoryVectorDto } from './dto/column-vector';
import { ResponseInputItem } from 'openai/resources/responses/responses.js';
import { AiToolsService } from './ai-tools.service';
import { OpenAiService } from './openAI/openAI.service';
import { JsonUtils } from './utils/json.utils';

@Injectable()
export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly aiToolsService: AiToolsService,
    private readonly openAiService: OpenAiService,
  ) {}

  private async processAiInteraction(
    message: string,
    history: ResponseInputItem[] = [],
  ): Promise<string> {
    const [categories, areaList] = await Promise.all([
      this.getCategories(message),
      this.buildAreaList(message),
    ]);

    const input: ResponseInputItem[] = [
      ...history,
      {
        role: 'user',
        content: message,
      },
    ];

    const toolCallResponse = await this.openAiService.toolCallAi(
      input,
      categories,
      areaList,
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
        output: JSON.stringify(toolResult, safeBigIntStringify),
      });
    }

    const analyzeResult = await this.openAiService.analyzeResults(input);
    const responseText = this.openAiService.getText(analyzeResult);

    const parsedFn = JsonUtils.extractFirstJson<{ actions: any[] }>(
      responseText,
    );

    if (parsedFn && Array.isArray(parsedFn.actions)) {
      this.patchCoordinates(parsedFn.actions, areaList);
      return JSON.stringify(parsedFn);
    }

    return responseText;
  }

  // 기존 단일 메시지 처리 함수 (하위 호환성 유지)
  async getAIMessage(message: string): Promise<string> {
    return this.processAiInteraction(message);
  }

  // 대화 히스토리 포함 메시지 처리 함수 (꼬리 질문 지원)
  private readonly MAX_HISTORY_LENGTH = 10;
  async getAIMessageWithHistory(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const recentHistory = history.slice(-this.MAX_HISTORY_LENGTH);
    const formattedHistory: ResponseInputItem[] = recentHistory.map((h) => ({
      role: h.role,
      content: h.content,
    }));
    return this.processAiInteraction(message, formattedHistory);
  }

  /**
   * 스트리밍 방식으로 AI 응답을 처리합니다.
   * 도구 호출까지는 서버에서 완료한 뒤, 최종 분석 결과만 스트리밍합니다.
   *
   * @returns AsyncIterable<string> - 텍스트 청크를 순차적으로 반환
   */
  async *getAIMessageWithHistoryStream(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): AsyncGenerator<string> {
    const recentHistory = history.slice(-this.MAX_HISTORY_LENGTH);
    const formattedHistory: ResponseInputItem[] = recentHistory.map((h) => ({
      role: h.role,
      content: h.content,
    }));

    // 1단계: 카테고리/지역 분석 및 도구 호출 (서버에서 완료)
    const [categories, areaList] = await Promise.all([
      this.getCategories(message),
      this.buildAreaList(message),
    ]);

    const input: ResponseInputItem[] = [
      ...formattedHistory,
      { role: 'user', content: message },
    ];

    const toolCallResponse = await this.openAiService.toolCallAi(
      input,
      categories,
      areaList,
    );
    input.push(...toolCallResponse.output);

    for (const toolCall of toolCallResponse.output) {
      if (toolCall.type !== 'function_call') continue;
      const toolResult = await this.aiToolsService.run(
        toolCall.name,
        toolCall.arguments,
      );
      if (toolResult === undefined) continue;

      input.push({
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify(toolResult, safeBigIntStringify),
      });
    }

    // 2단계: 최종 분석 결과 스트리밍
    const stream = await this.openAiService.analyzeResultsStream(input);

    for await (const event of stream) {
      // OpenAI 스트림 이벤트에서 텍스트 델타 추출
      if (
        event.type === 'response.output_text.delta' &&
        'delta' in event &&
        typeof event.delta === 'string'
      ) {
        yield event.delta; // 클라이언트에 청크 전송
      }
    }

    // 3단계: 스트림 종료 후 areaList 정보를 마지막에 메타데이터로 전송 (좌표 패칭용)
    yield `\n[AREA_LIST]:${JSON.stringify(areaList.map((a) => ({ areaName: a?.areaName, lat: a?.lat, lng: a?.lng })))}`;
  }

  /**
   * AI가 생성한 좌표(Hallucination 가능성 있음)를 DB에서 조회한 신뢰할 수 있는 좌표로 보정합니다.
   */
  private patchCoordinates(actions: any[], areaList: any[]) {
    let modified = false;
    actions.forEach((action: any) => {
      if (action.payload?.areaName) {
        const targetAreaName = action.payload.areaName;

        // 1. 정확히 이름이 일치하는 지역 찾기 (우선순위 높음)
        // 2. 없으면 검색된 첫 번째 지역 사용 (Fallback)
        const foundArea =
          areaList.find((a) => a.areaName === targetAreaName) || areaList[0];

        if (
          foundArea &&
          foundArea.areaName === targetAreaName &&
          foundArea.lat &&
          foundArea.lng
        ) {
          // 좌표가 없거나, 분석 패널 열기 액션인 경우 DB 좌표로 강제 보정
          if (
            !action.payload.lat ||
            !action.payload.lng ||
            action.type === 'ui.open_panel'
          ) {
            action.payload.lat = foundArea.lat;
            action.payload.lng = foundArea.lng;
            // zoom 레벨도 필요시 보정 (예: 상권이면 15)
            if (!action.payload.zoom) {
              action.payload.zoom = 15;
            }
            console.log(
              `[AiService] Patched coordinates for ${action.type} (${targetAreaName}):`,
              foundArea.lat,
              foundArea.lng,
            );
            modified = true;
          }
        }
      }
    });
    return modified;
  }

  async getAreaByMessage(message: string) {
    const [categories, areaList, tables] = await Promise.all([
      this.getCategories(message),
      this.buildAreaList(message),
      this.getTables(message),
    ]);

    if (tables.length === 0) return [];

    const query = await this.openAiService.getRecommendCommercialAreasQuery(
      message,
      categories,
      areaList,
      tables,
    );
    console.log('Generated SQL:', this.openAiService.getText(query));
    const result = await this.aiRepository.runSql(
      this.openAiService.getText(query),
    );
    return result;
  }

  async getAnalysis(topic: string, areaName: string, metrics: string) {
    const response = await this.openAiService.getAiAnalysis(
      topic,
      areaName,
      metrics,
    );
    return this.openAiService.getText(response);
  }

  async getRealEstateSummary(metrics: string) {
    const response = await this.openAiService.getRealEstateSummary(metrics);
    return this.openAiService.getText(response);
  }

  private async buildAreaList(message: string) {
    const areaText = this.openAiService.getText(
      await this.openAiService.getLocationByMessage(message),
    );
    if (areaText === '""') return [];
    const messageAreaList = areaText.split(',').map((area) => area.trim());

    const results = await Promise.all(
      messageAreaList.map(async (area) => {
        const areaVector = await this.openAiService.embedText(area);
        const [first] = await this.aiRepository.areaSearchByVector(
          areaVector.data[0].embedding,
          1,
        );

        if (first) {
          console.log(
            `[DEBUG] Area found in vector DB: ${first.areaName} (${first.areaCode}, ${first.areaLevel})`,
          );
          const coords = await this.aiRepository.getAreaCoordinates(
            first.areaCode,
            first.areaLevel,
          );
          console.log(`[DEBUG] Coords fetched for ${first.areaName}:`, coords);
          if (coords) {
            first.lat = coords.lat;
            first.lng = coords.lng;
          }
        }
        return first;
      }),
    );
    return results;
  }

  private async getCategories(message: string) {
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

  private async getTables(message: string) {
    const tableList = await this.openAiService.getTablesByMessage(message);
    if (this.openAiService.getText(tableList) === '""') return [];
    const categories = this.openAiService
      .getText(tableList)
      .split(',')
      .map((cat) => cat.trim());
    return categories;
  }
}

function safeBigIntStringify(key: string, value: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof value === 'bigint' ? value.toString() : value;
}
