/**
 * Assistant Service - Claude 기반 채팅 비즈니스 로직
 * 기존 ai.service.ts의 구조를 참조하되 Claude용으로 재구성
 */
import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeService } from './claude.service';
import { CLAUDE_PROMPTS } from './prompts/claude-prompts';
import { TOOLS } from '../ai/tools/definitions';

// ai 폴더에서 재사용
import { AiRepository } from '../ai/ai.repository';
import { AiToolsService } from '../ai/ai-tools.service';
import { AiResponseProcessor } from '../ai/ai-response.processor';
import { OpenAiService } from '../ai/openAI/open-ai.service';
import { ChatRepository } from '../ai/chat.repository'; // 히스토리 저장용
import {
  BusinessCategoryVectorDto,
  AreaVectorDto,
} from '../ai/dto/column-vector';
import { getToolMetadata } from '../ai/tools/tool-metadata';

@Injectable()
export class AssistantService {
  // OpenAI와 동일한 히스토리 설정
  private readonly MAX_HISTORY_LENGTH = 50;
  // 벡터 검색 신뢰도 임계값
  private readonly DISTANCE_THRESHOLD = 0.4;

  constructor(
    private readonly claudeService: ClaudeService,
    private readonly aiRepository: AiRepository,
    private readonly aiToolsService: AiToolsService,
    private readonly aiResponseProcessor: AiResponseProcessor,
    private readonly openAiService: OpenAiService,
    private readonly chatRepository: ChatRepository, // 히스토리 저장용
  ) {
    console.log('[AssistantService] Claude Assistant initialized');
  }

  /**
   * 대화 히스토리 포함 메시지 처리 (메인 진입점)
   *
   * [변경사항]
   * [변경사항]
   * - history 파라미터 제거 → DB에서 로드
   * - userId, conversationId로 DB 히스토리 관리
   */
  async getMessageWithHistory(
    message: string,
    userId: string, // 필수로 변경
    conversationId?: string,
  ): Promise<{ reply: string; actions: unknown[]; sources?: { tool: string; displayName: string; source: string }[]; conversationId?: string }> {
    // 0. conversationId 처리 (DB 저장 시 필요)
    let currentConversationId = conversationId;

    // 대화 생성 또는 조회
    if (!currentConversationId) {
      // 새 대화 생성
      const conversation = await this.chatRepository.createConversation({
        userId,
        title: message.slice(0, 50),
      });
      currentConversationId = conversation.id;
      console.log(
        `[AssistantService] Created new conversation: ${currentConversationId}`,
      );
    } else {
      // 기존 대화: 소유자 검증 (OpenAI와 동일)
      const conversation = await this.chatRepository.getConversation(
        currentConversationId,
      );
      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found or access denied');
      }
    }

    // DB에서 히스토리 로드 (OpenAI와 동일: 50개)
    const historyMessages =
      await this.chatRepository.listMessagesByConversation(
        currentConversationId,
        { take: this.MAX_HISTORY_LENGTH, order: 'asc' },
      );
    const history = historyMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
    console.log(`[AssistantService] Loaded ${history.length} messages from DB`);

    // 사용자 메시지 저장
    await this.chatRepository.addMessage({
      conversationId: currentConversationId,
      role: 'user',
      content: message,
    });

    // 1. 업종/지역 정보 수집
    const [categories, areaList] = await Promise.all([
      this.getCategories(message),
      this.getAreaInfo(message),
    ]);

    // 2. Claude 메시지 배열 구성
    const messages: Anthropic.MessageParam[] = [];

    // DB에서 로드한 히스토리 추가 (OpenAI와 동일하게 항상 사용)
    if (history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
      console.log(`[AssistantService] History: ${history.length} messages`);
    }

    // 현재 사용자 메시지
    messages.push({ role: 'user', content: message });

    // 3. Tool Calling (1차 호출) - OpenAI로 빠른 Tool 선택(tlqkf claude 개느려)
    const toolCallStart = Date.now();

    // OpenAI Responses API용 input 구성
    const openAiInput = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content:
        typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));

    const openAiResponse = await this.openAiService.toolCallAi(
      openAiInput,
      categories,
      areaList,
    );

    const toolCallTime = Date.now() - toolCallStart;
    console.log(
      `[AssistantService] 🕐 OpenAI Tool Selection Time: ${toolCallTime}ms`,
    );

    // OpenAI 응답에서 Tool Calls 추출
    const toolCalls: Array<{
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }> = [];

    if (openAiResponse.output) {
      for (const item of openAiResponse.output) {
        if (item.type === 'function_call') {
          toolCalls.push({
            id: item.call_id,
            name: item.name,
            arguments: JSON.parse(item.arguments),
          });
        }
      }
    }

    console.log(`[AssistantService] Tool calls: ${toolCalls.length}`);

    // 사용된 Tool 이름 수집
    const usedTools: string[] = toolCalls.map((tc) => tc.name);

    // 4. Tool 실행 및 결과 수집
    let breakEvenContext: {
      type: 'listing' | 'area';
      id: string;
      categoryCode?: string;
    } | null = null;
    // 매물 추천 결과 저장 (list.listings 액션에 markers 주입용)
    interface ListingItem {
      listingNumber: number;
      listingId: string;
      title: string;
      latitude?: number;
      longitude?: number;
    }
    interface RecommendRealEstateResult {
      data?: ListingItem[];
    }
    let recommendRealEstateResult: RecommendRealEstateResult | null = null;

    const toolResultBlocks: Array<{
      type: 'tool_result';
      tool_use_id: string;
      content: string;
    }> = [];

    for (const toolCall of toolCalls) {
      // 손익분기 컨텍스트 추적 (categoryCode 포함)
      if (toolCall.name === 'calc_break_even_with_listing') {
        const listingId = toolCall.arguments.listingId as string | undefined;
        const categoryCode = toolCall.arguments.categoryCode as
          | string
          | undefined;
        if (listingId)
          breakEvenContext = { type: 'listing', id: listingId, categoryCode };
      } else if (toolCall.name === 'calc_break_even') {
        const areaCd = toolCall.arguments.areaCd as string | undefined;
        const categoryCode = toolCall.arguments.categoryCode as
          | string
          | undefined;
        if (areaCd)
          breakEvenContext = { type: 'area', id: areaCd, categoryCode };
      }

      // Tool 실행
      const toolResult = await this.aiToolsService.run(
        toolCall.name,
        JSON.stringify(toolCall.arguments),
      );

      if (toolResult === undefined) continue;

      // recommend_real_estate 결과 저장 (나중에 markers로 주입)
      if (toolCall.name === 'recommend_real_estate' && toolResult) {
        recommendRealEstateResult = toolResult as RecommendRealEstateResult;
      }

      // tool_result 블록 수집
      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: JSON.stringify(toolResult, (k, v) =>
          this.aiResponseProcessor.safeBigIntStringify(k, v),
        ),
      });
    }

    // OpenAI Tool Call 결과를 텍스트로 변환하여 Claude에 전달
    if (toolCalls.length > 0) {
      // Tool Call을 텍스트로 변환
      const toolCallText = toolCalls
        .map((tc) => `[Tool Call] ${tc.name}(${JSON.stringify(tc.arguments)})`)
        .join('\n');

      // Tool Result를 텍스트로 변환
      const toolResultText = toolResultBlocks
        .map((tr) => `[Tool Result] ${tr.content}`)
        .join('\n');

      messages.push({
        role: 'assistant',
        content: toolCallText,
      });

      messages.push({
        role: 'user',
        content: toolResultText,
      });
    }

    // 5. 결과 분석 (2차 호출)
    console.log(`[AssistantService] Calling analyzeResults...`);

    // analyzeResults는 tools 없이 호출되므로, tool_use/tool_result를 텍스트로 변환
    const textMessages: Anthropic.MessageParam[] = messages.map((msg) => {
      if (typeof msg.content === 'string') {
        return msg;
      }

      // content가 배열인 경우 (tool_use 또는 tool_result)
      const contentBlocks = msg.content as Array<{
        type: string;
        name?: string;
        input?: Record<string, unknown>;
        content?: string;
      }>;
      const textParts = contentBlocks.map((block) => {
        if (block.type === 'tool_use') {
          return `[Tool Call] ${block.name ?? 'unknown'}(${JSON.stringify(block.input ?? {})})`;
        } else if (block.type === 'tool_result') {
          return `[Tool Result] ${block.content ?? ''}`;
        }
        return JSON.stringify(block);
      });

      return {
        role: msg.role,
        content: textParts.join('\n'),
      };
    });

    // [DEBUG] 변환된 메시지 확인
    console.log('[DEBUG] Text Messages for analyzeResults:');
    textMessages.forEach((msg, i) => {
      const content =
        typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content);
      const preview =
        content.length > 300 ? content.substring(0, 300) + '...' : content;
      console.log(`  [${i}] role=${msg.role}`);
      console.log(`      content: ${preview}`);
    });

    const responseText = await this.claudeService.analyzeResults(
      textMessages,
      CLAUDE_PROMPTS.ANALYZE_RESULTS_SYSTEM,
    );
    console.log('[AssistantService] Raw Response:', responseText);

    // 6. 응답 파싱 및 후처리
    const parsedResponse = this.aiResponseProcessor.parseResponse(responseText);

    // sources 배열 생성
    if (usedTools.length > 0) {
      parsedResponse.sources = usedTools.map((name) => ({
        tool: name,
        ...getToolMetadata(name),
      }));
    }

    // [DEBUG] 파싱된 응답 확인
    console.log('[DEBUG] Parsed Response:');
    console.log('  reply:', parsedResponse.reply?.substring(0, 100) + '...');
    console.log('  actions:', JSON.stringify(parsedResponse.actions, null, 2));

    // chart.breakeven 액션 패치/추가 (listingId 또는 areaCode + industryCode 보장)
    if (breakEvenContext) {
      parsedResponse.actions = parsedResponse.actions || [];
      const existingAction = parsedResponse.actions.find(
        (a) => a.type === 'chart.breakeven',
      );

      // listingId 또는 areaCode + industryCode(categoryCode) 포함
      const correctPayload =
        breakEvenContext.type === 'listing'
          ? {
              listingId: breakEvenContext.id,
              ...(breakEvenContext.categoryCode && {
                industryCode: breakEvenContext.categoryCode,
              }),
            }
          : {
              areaCode: breakEvenContext.id,
              ...(breakEvenContext.categoryCode && {
                industryCode: breakEvenContext.categoryCode,
              }),
            };

      if (existingAction) {
        // Claude가 잘못된 payload를 생성했을 수 있으므로 덮어쓰기
        console.log(
          '[AssistantService] Patching chart.breakeven payload with correct value',
          correctPayload,
        );
        existingAction.payload = correctPayload;
      } else {
        console.log('[AssistantService] Injecting chart.breakeven action');
        parsedResponse.actions.push({
          type: 'chart.breakeven',
          payload: correctPayload,
        });
      }
    }

    // list.listings 액션에 markers 주입 (프론트엔드 히스토리에 UUID 저장용)
    if (recommendRealEstateResult?.data && parsedResponse.actions) {
      const listingsAction = parsedResponse.actions.find(
        (a) => a.type === 'list.listings',
      );
      if (listingsAction) {
        listingsAction.payload = listingsAction.payload || {};
        listingsAction.payload.markers = recommendRealEstateResult.data.map(
          (item) => ({
            id: item.listingId,
            listingNumber: item.listingNumber,
            title: item.title,
            lat: item.latitude || 0,
            lng: item.longitude || 0,
            label: String(item.listingNumber),
            type: 'listing',
          }),
        );
        console.log(
          `[AssistantService] Injected ${recommendRealEstateResult.data.length} markers into list.listings action`,
        );
      }
    }

    // 좌표 패치 및 최종 JSON 반환
    const finalJson = this.aiResponseProcessor.patchCoordinates(
      parsedResponse,
      areaList,
    );

    // AI 응답을 JSON 파싱
    const parsedResult = JSON.parse(finalJson) as {
      reply: string;
      actions: unknown[];
      sources?: { tool: string; displayName: string; source: string }[];
    };

    // 매물 번호-UUID 매핑 정보를 reply에 추가 (DB 저장 시 히스토리에 포함되도록)
    // 프론트엔드 useChat.ts와 동일한 형식 사용
    let contentWithMarkers = parsedResult.reply;
    const listingsAction = parsedResult.actions?.find(
      (a: { type: string }) => a.type === 'list.listings'
    ) as { type: string; payload?: { markers?: unknown } } | undefined;
    
    if (listingsAction?.payload?.markers) {
      contentWithMarkers += `\n\n[매물 목록 참조용 - 이 메시지는 사용자에게 보이지 않습니다]\n${JSON.stringify(listingsAction.payload.markers)}`;
      console.log(`[AssistantService] Added markers to content for DB storage`);
    }

    // AI 응답 DB 저장 (userId가 있는 경우)
    if (userId && currentConversationId) {
      await this.chatRepository.addMessage({
        conversationId: currentConversationId,
        role: 'assistant',
        content: contentWithMarkers, // 매핑 정보 포함된 응답 저장
      });
      console.log(`[AssistantService] Saved AI response to DB`);
    }

    return {
      reply: parsedResult.reply,
      actions: parsedResult.actions,
      sources: parsedResult.sources,
      conversationId: currentConversationId,
    };
  }

  /**
   * OpenAI 형식의 TOOLS를 Claude 형식으로 변환(임시로, Deprecated)
   */
  private convertToolsForClaude() {
    return TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        properties:
          (tool.parameters as { properties?: Record<string, unknown> })
            .properties || {},
        required: (tool.parameters as { required?: string[] }).required || [],
        additionalProperties: false,
      },
    }));
  }

  /**
   * 메시지에서 업종 정보 추출 (ai.service.ts 로직 동일)
   */
  private async getCategories(
    message: string,
  ): Promise<BusinessCategoryVectorDto[]> {
    const categoryResponse =
      await this.openAiService.getCategoryByMessage(message);
    const categoryText = this.openAiService.getText(categoryResponse);
    console.log(`[DEBUG] Extracted Categories: "${categoryText}"`);

    if (categoryText === '""') return [];

    const categories = categoryText.split(',').map((cat) => cat.trim());
    let categoryList: BusinessCategoryVectorDto[] = [];

    for (const category of categories) {
      const categoryVector = await this.openAiService.embedText(category);
      const categoryResults = await this.aiRepository.categorySearchByVector(
        categoryVector.data[0].embedding,
        3,
      );
      categoryList = categoryList.concat(categoryResults);
    }
    return categoryList;
  }

  /**
   * 메시지에서 지역 정보 추출 (ai.service.ts 로직 동일)
   */
  private async getAreaInfo(message: string): Promise<AreaVectorDto[]> {
    const areaText = this.openAiService.getText(
      await this.openAiService.getLocationByMessage(message),
    );
    if (areaText === '""') return [];

    const messageAreaList = areaText.split(',').map((area) => area.trim());

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

        // 신뢰도 체크
        let finalCandidates = vectorCandidates;
        if (
          vectorCandidates.length === 0 ||
          Number(vectorCandidates[0].distance) > this.DISTANCE_THRESHOLD
        ) {
          const textCandidates = await this.aiRepository.areaSearchByText(
            area,
            3,
          );
          if (textCandidates.length > 0) {
            const seenCodes = new Set(textCandidates.map((c) => c.areaCode));
            const mergedCandidates = [
              ...textCandidates,
              ...vectorCandidates.filter((c) => !seenCodes.has(c.areaCode)),
            ];
            finalCandidates = mergedCandidates.slice(0, 3);
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
}
