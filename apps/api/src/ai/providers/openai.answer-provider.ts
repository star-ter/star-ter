import { Injectable } from '@nestjs/common';
import { ResponseInputItem } from 'openai/resources/responses/responses.js';
import { OpenAiService } from './openai/openai.service';
import { AnswerContext, AnswerProvider } from '../core/ai-types';

@Injectable()
export class OpenAiAnswerProvider implements AnswerProvider {
  constructor(private readonly openAiService: OpenAiService) {}

  async analyze(ctx: AnswerContext): Promise<string> {
    const input: ResponseInputItem[] = ctx.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const toolCallItems: ResponseInputItem[] = ctx.toolCalls.map(
      (toolCall) => ({
        type: 'function_call',
        call_id: toolCall.id,
        name: toolCall.name,
        arguments: toolCall.argsJson,
      }),
    );

    const toolResultItems: ResponseInputItem[] = ctx.toolResults.map(
      (toolResult) => ({
        type: 'function_call_output',
        call_id: toolResult.toolCallId,
        output: toolResult.outputJson,
      }),
    );

    input.push(...toolCallItems, ...toolResultItems);

    const response = await this.openAiService.analyzeResults(input);
    return this.openAiService.getText(response);
  }

  async stream(
    ctx: AnswerContext,
    onDelta: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const input: ResponseInputItem[] = ctx.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const toolCallItems: ResponseInputItem[] = ctx.toolCalls.map(
      (toolCall) => ({
        type: 'function_call',
        call_id: toolCall.id,
        name: toolCall.name,
        arguments: toolCall.argsJson,
      }),
    );

    const toolResultItems: ResponseInputItem[] = ctx.toolResults.map(
      (toolResult) => ({
        type: 'function_call_output',
        call_id: toolResult.toolCallId,
        output: toolResult.outputJson,
      }),
    );

    input.push(...toolCallItems, ...toolResultItems);

    return this.openAiService.streamAnalyzeResults(input, onDelta, signal);
  }
}
