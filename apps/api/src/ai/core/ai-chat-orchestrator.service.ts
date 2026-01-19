import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { AiContextService } from './ai-context.service';
import { AiMessage, AiProviderName, ToolCall, ToolResult } from './ai-types';
import { ChatRepository } from '../chat.repository';
import { AiToolsService } from '../ai-tools.service';
import { AiResponseProcessor } from '../ai-response.processor';
import { getToolMetadata } from '../tools/tool-metadata';
import { ActionMapperService } from './action-mapper.service';
import { OpenAiToolPlanner } from '../providers/openai.tool-planner';
import { ClaudeToolPlanner } from '../providers/claude.tool-planner';
import { OpenAiAnswerProvider } from '../providers/openai.answer-provider';
import { ClaudeAnswerProvider } from '../providers/claude.answer-provider';

export interface AiChatOptions {
  aiProvider?: AiProviderName;
  toolPlanner?: AiProviderName;
}

export interface AiChatResponse {
  reply: string;
  actions: unknown[];
  sources?: { tool: string; displayName: string; source: string }[];
  conversationId: string;
}

export type AiStreamEventName = 'meta' | 'actions' | 'delta' | 'done' | 'error';

export type AiStreamEventHandler = (
  event: AiStreamEventName,
  data: Record<string, unknown>,
) => void;

@Injectable()
export class AiChatOrchestrator {
  private readonly MAX_HISTORY_LENGTH = 50;

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly contextService: AiContextService,
    private readonly aiToolsService: AiToolsService,
    private readonly aiResponseProcessor: AiResponseProcessor,
    private readonly actionMapper: ActionMapperService,
    private readonly openAiPlanner: OpenAiToolPlanner,
    private readonly claudePlanner: ClaudeToolPlanner,
    private readonly openAiAnswerProvider: OpenAiAnswerProvider,
    private readonly claudeAnswerProvider: ClaudeAnswerProvider,
  ) {}

  async handleMessage(
    userId: string,
    conversationId: string | null,
    message: string,
    options: AiChatOptions = {},
  ): Promise<AiChatResponse> {
    const startTime = Date.now();
    console.log(
      `[AiChatOrchestrator] Starting handleMessage for user ${userId}`,
    );

    const currentConversationId = await this.resolveConversationId(
      userId,
      conversationId,
      message,
    );

    const historyMessages =
      await this.chatRepository.listMessagesByConversation(
        currentConversationId,
        { take: this.MAX_HISTORY_LENGTH, order: 'asc' },
      );
    const listingIdLookup = this.buildListingIdLookup(historyMessages);
    const history: AiMessage[] = historyMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    await this.chatRepository.addMessage({
      conversationId: currentConversationId,
      role: 'user',
      content: message,
    });

    const messages: AiMessage[] = [
      ...history,
      { role: 'user', content: message },
    ];

    console.log(
      `[AiChatOrchestrator] Context extraction start (${Date.now() - startTime}ms)`,
    );
    const [categories, areas] = await Promise.all([
      this.contextService.getCategories(message),
      this.contextService.getAreaInfo(message),
    ]);
    console.log(
      `[AiChatOrchestrator] Context extraction end (${Date.now() - startTime}ms)`,
    );

    const plannerName = options.toolPlanner || 'openai';
    const answerName = options.aiProvider || 'openai';

    console.log(
      `[AiChatOrchestrator] Tool planning start with ${plannerName} (${Date.now() - startTime}ms)`,
    );
    const plannedToolCalls = await this.getPlanner(plannerName).planTools({
      messages,
      categories,
      areas,
    });
    const toolCalls = this.normalizeListingIds(
      plannedToolCalls,
      listingIdLookup,
    );
    console.log(
      `[AiChatOrchestrator] Tool planning end. Calls: ${toolCalls.length} (${Date.now() - startTime}ms)`,
    );
    if (toolCalls.length > 0) {
      console.log(
        `[AiChatOrchestrator] Tool calls: ${JSON.stringify(
          toolCalls.map((t) => t.name),
        )}`,
      );
    }

    console.log(
      `[AiChatOrchestrator] Tool execution start (${Date.now() - startTime}ms)`,
    );
    const toolResults = await this.runTools(toolCalls);
    console.log(
      `[AiChatOrchestrator] Tool execution end (${Date.now() - startTime}ms)`,
    );

    console.log(
      `[AiChatOrchestrator] Answer generation start with ${answerName} (${Date.now() - startTime}ms)`,
    );
    const responseText = await this.getAnswerProvider(answerName).analyze({
      messages,
      toolCalls,
      toolResults,
    });
    console.log(
      `[AiChatOrchestrator] Answer generation end (${Date.now() - startTime}ms)`,
    );
    console.log(
      `[AiChatOrchestrator] Raw LLM Response (preview): ${responseText.slice(0, 200)}...`,
    );

    const actions = this.actionMapper.buildActions(toolCalls, toolResults);
    const sources =
      toolCalls.length > 0
        ? toolCalls.map((toolCall) => ({
            tool: toolCall.name,
            ...getToolMetadata(toolCall.name),
          }))
        : undefined;

    const finalJson = this.aiResponseProcessor.patchCoordinates(
      { reply: responseText, actions, sources },
      areas,
    );

    const finalResult = this.parseFinalResponse(finalJson);

    console.log(`[AiChatOrchestrator] Final Backend Response (preview):`);
    console.log(`- Reply: ${finalResult.reply.slice(0, 100)}...`);
    console.log(`- Actions: ${JSON.stringify(finalResult.actions)}`);
    const markersForHistory = this.extractMarkersFromActions(
      finalResult.actions,
    );
    const metadata = this.buildMessageMetadata({
      actions: finalResult.actions,
      sources: finalResult.sources,
      markers: markersForHistory,
    });

    await this.chatRepository.addMessage({
      conversationId: currentConversationId,
      role: 'assistant',
      content: finalResult.reply,
      metadata,
    });

    const totalTime = Date.now() - startTime;
    console.log(
      `[AiChatOrchestrator] handleMessage completed in ${totalTime}ms`,
    );

    return {
      reply: finalResult.reply,
      actions: finalResult.actions,
      sources: finalResult.sources,
      conversationId: currentConversationId,
    };
  }

  async handleMessageStream(
    userId: string,
    conversationId: string | null,
    message: string,
    options: AiChatOptions,
    onEvent: AiStreamEventHandler,
    signal?: AbortSignal,
  ): Promise<void> {
    const startTime = Date.now();
    console.log(
      `[AiChatOrchestrator] Starting handleMessageStream for user ${userId}`,
    );

    const currentConversationId = await this.resolveConversationId(
      userId,
      conversationId,
      message,
    );

    const historyMessages =
      await this.chatRepository.listMessagesByConversation(
        currentConversationId,
        { take: this.MAX_HISTORY_LENGTH, order: 'asc' },
      );
    const listingIdLookup = this.buildListingIdLookup(historyMessages);
    const history: AiMessage[] = historyMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    await this.chatRepository.addMessage({
      conversationId: currentConversationId,
      role: 'user',
      content: message,
    });

    const messages: AiMessage[] = [
      ...history,
      { role: 'user', content: message },
    ];

    const [categories, areas] = await Promise.all([
      this.contextService.getCategories(message),
      this.contextService.getAreaInfo(message),
    ]);

    const plannerName = options.toolPlanner || 'openai';
    const answerName = options.aiProvider || 'openai';

    const plannedToolCalls = await this.getPlanner(plannerName).planTools({
      messages,
      categories,
      areas,
    });
    const toolCalls = this.normalizeListingIds(
      plannedToolCalls,
      listingIdLookup,
    );
    const toolResults = await this.runTools(toolCalls);

    const actions = this.actionMapper.buildActions(toolCalls, toolResults);
    const sources =
      toolCalls.length > 0
        ? toolCalls.map((toolCall) => ({
            tool: toolCall.name,
            ...getToolMetadata(toolCall.name),
          }))
        : undefined;

    const responseForPatch = { reply: '', actions, sources };
    this.aiResponseProcessor.patchCoordinates(responseForPatch, areas);

    const patchedActions = responseForPatch.actions ?? [];
    const patchedSources = responseForPatch.sources;
    const markersForHistory = this.extractMarkersFromActions(patchedActions);

    onEvent('meta', { conversationId: currentConversationId });
    if (patchedActions.length > 0 || (patchedSources?.length ?? 0) > 0) {
      onEvent('actions', { actions: patchedActions, sources: patchedSources });
    }

    let reply = '';
    let aborted = signal?.aborted ?? false;
    if (signal && !aborted) {
      signal.addEventListener(
        'abort',
        () => {
          aborted = true;
        },
        { once: true },
      );
    }

    try {
      console.log(`[AiChatOrchestrator] Starting stream with ${answerName}`);
      reply = await this.getAnswerProvider(answerName).stream(
        { messages, toolCalls, toolResults },
        (chunk) => {
          if (!chunk || signal?.aborted) return;
          console.log(
            `[AiChatOrchestrator] Delta chunk: ${chunk.slice(0, 50)}...`,
          );
          reply += chunk;
          onEvent('delta', { text: chunk });
        },
        signal,
      );
      console.log(
        `[AiChatOrchestrator] Stream completed, total length: ${reply.length}`,
      );

      if (!signal?.aborted) {
        onEvent('done', {
          reply,
          actions: patchedActions,
          sources: patchedSources,
          conversationId: currentConversationId,
        });
      }
    } catch (error) {
      if (!signal?.aborted) {
        const message =
          error instanceof Error ? error.message : 'Stream failed';
        onEvent('error', { message });
      }
    } finally {
      if (reply.length > 0 || aborted) {
        const metadata = this.buildMessageMetadata({
          actions: patchedActions,
          sources: patchedSources,
          markers: markersForHistory,
          streamAborted: aborted,
        });
        await this.chatRepository.addMessage({
          conversationId: currentConversationId,
          role: 'assistant',
          content: reply,
          metadata,
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `[AiChatOrchestrator] handleMessageStream completed in ${totalTime}ms`,
    );
  }

  private async resolveConversationId(
    userId: string,
    conversationId: string | null,
    message: string,
  ): Promise<string> {
    if (!conversationId) {
      const conversation = await this.chatRepository.createConversation({
        userId,
        title: message.slice(0, 50),
      });
      return conversation.id;
    }

    const conversation =
      await this.chatRepository.getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error('Conversation not found or access denied');
    }

    return conversationId;
  }

  private getPlanner(
    name: AiProviderName,
  ): OpenAiToolPlanner | ClaudeToolPlanner {
    return name === 'claude' ? this.claudePlanner : this.openAiPlanner;
  }

  private getAnswerProvider(
    name: AiProviderName,
  ): OpenAiAnswerProvider | ClaudeAnswerProvider {
    return name === 'claude'
      ? this.claudeAnswerProvider
      : this.openAiAnswerProvider;
  }

  private async runTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const toolResults: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      console.log(`[AiChatOrchestrator] Executing tool: ${toolCall.name}`);
      const toolResult = await this.aiToolsService.run(
        toolCall.name,
        toolCall.argsJson,
      );

      if (toolResult === undefined) {
        console.log(
          `[AiChatOrchestrator] Tool ${toolCall.name} returned undefined, skipping result`,
        );
        continue;
      }

      toolResults.push({
        toolCallId: toolCall.id,
        name: toolCall.name,
        output: toolResult,
        outputJson: JSON.stringify(toolResult, (k, v) =>
          this.aiResponseProcessor.safeBigIntStringify(k, v),
        ),
      });
    }

    return toolResults;
  }

  private parseFinalResponse(finalJson: string): {
    reply: string;
    actions: unknown[];
    sources?: { tool: string; displayName: string; source: string }[];
  } {
    try {
      const parsed = JSON.parse(finalJson) as {
        reply?: string;
        actions?: unknown[];
        sources?: { tool: string; displayName: string; source: string }[];
      };
      return {
        reply: parsed.reply || '',
        actions: parsed.actions || [],
        sources: parsed.sources,
      };
    } catch {
      return { reply: finalJson, actions: [] };
    }
  }

  private extractMarkersFromActions(actions: unknown[]): unknown[] {
    for (const action of actions) {
      if (!action || typeof action !== 'object') continue;
      const actionRecord = action as { type?: string; payload?: unknown };
      if (actionRecord.type !== 'list.listings') continue;
      const payload = actionRecord.payload as { markers?: unknown };
      if (Array.isArray(payload?.markers)) {
        return payload.markers;
      }
    }

    return [];
  }

  private buildMessageMetadata(params: {
    actions: unknown[];
    sources?: { tool: string; displayName: string; source: string }[];
    markers: unknown[];
    streamAborted?: boolean;
  }): Prisma.InputJsonValue | undefined {
    const metadata: Record<string, unknown> = {};

    if (params.actions.length > 0) {
      metadata.actions = params.actions;
    }
    if (params.sources && params.sources.length > 0) {
      metadata.sources = params.sources;
    }
    if (params.markers.length > 0) {
      metadata.markers = params.markers;
    }
    if (params.streamAborted) {
      metadata.streamAborted = true;
    }

    return Object.keys(metadata).length > 0
      ? (metadata as Prisma.InputJsonValue)
      : undefined;
  }

  private buildListingIdLookup(
    historyMessages: Array<{ content: string; metadata?: unknown | null }>,
  ): Map<number, string> {
    const lookup = new Map<number, string>();

    for (const message of historyMessages) {
      const markers = this.extractMarkersFromMetadata(message.metadata);
      const fallbackMarkers =
        markers.length > 0
          ? markers
          : this.extractMarkersFromContent(message.content);

      for (const marker of fallbackMarkers) {
        if (!marker || typeof marker !== 'object') continue;
        const record = marker as Record<string, unknown>;

        const listingNumber = this.coerceListingNumber(
          record.listingNumber ?? record.listingNo ?? record.label,
        );
        const listingId = this.pickString(record.listingId, record.id);

        if (listingNumber !== null && listingId) {
          lookup.set(listingNumber, listingId);
        }
      }
    }

    return lookup;
  }

  private normalizeListingIds(
    toolCalls: ToolCall[],
    listingIdLookup: Map<number, string>,
  ): ToolCall[] {
    if (listingIdLookup.size === 0) return toolCalls;

    let updatedCount = 0;
    const normalized = toolCalls.map((toolCall) => {
      if (toolCall.name !== 'calc_break_even_with_listing') {
        return toolCall;
      }

      const listingIdValue = toolCall.args?.listingId;
      const resolved = this.resolveListingId(listingIdValue, listingIdLookup);
      if (!resolved || resolved === listingIdValue) {
        return toolCall;
      }

      updatedCount += 1;
      const args = { ...toolCall.args, listingId: resolved };
      return {
        ...toolCall,
        args,
        argsJson: JSON.stringify(args),
      };
    });

    if (updatedCount > 0) {
      console.log(
        `[AiChatOrchestrator] Mapped ${updatedCount} listing reference(s) from history`,
      );
    }

    return normalized;
  }

  private resolveListingId(
    listingIdValue: unknown,
    listingIdLookup: Map<number, string>,
  ): string | null {
    if (typeof listingIdValue === 'string') {
      const trimmed = listingIdValue.trim();
      if (trimmed && this.isUuid(trimmed)) {
        return trimmed;
      }
    }

    const listingNumber = this.coerceListingNumber(listingIdValue);
    if (listingNumber === null) return null;

    return listingIdLookup.get(listingNumber) ?? null;
  }

  private extractMarkersFromMetadata(metadata: unknown): unknown[] {
    if (!metadata || typeof metadata !== 'object') return [];
    const record = metadata as {
      markers?: unknown;
      actions?: unknown;
    };

    if (Array.isArray(record.markers)) {
      return record.markers;
    }
    if (Array.isArray(record.actions)) {
      return this.extractMarkersFromActions(record.actions);
    }

    return [];
  }

  private extractMarkersFromContent(content: string): unknown[] {
    const markerTag =
      '[매물 목록 참조용 - 이 메시지는 사용자에게 보이지 않습니다]';
    const index = content.indexOf(markerTag);
    if (index === -1) return [];

    const jsonText = content.slice(index + markerTag.length).trim();
    if (!jsonText) return [];

    try {
      const parsed = JSON.parse(jsonText) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private coerceListingNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || this.isUuid(trimmed)) return null;
      const match = trimmed.match(/(\d+)/);
      if (!match) return null;
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) return Math.trunc(parsed);
    }

    return null;
  }

  private pickString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
