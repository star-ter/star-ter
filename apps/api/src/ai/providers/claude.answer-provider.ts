import { Injectable } from '@nestjs/common';
import type Anthropic from '@anthropic-ai/sdk';
import { ClaudeService } from './claude/claude.service';
import { CLAUDE_PROMPTS } from '../prompts/claude-prompts';
import { AnswerContext, AnswerProvider } from '../core/ai-types';

@Injectable()
export class ClaudeAnswerProvider implements AnswerProvider {
  constructor(private readonly claudeService: ClaudeService) {}

  async analyze(ctx: AnswerContext): Promise<string> {
    const messages: Anthropic.MessageParam[] = ctx.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (ctx.toolCalls.length > 0) {
      const toolCallText = ctx.toolCalls
        .map((toolCall) => `[Tool Call] ${toolCall.name}(${toolCall.argsJson})`)
        .join('\n');

      const toolResultText = ctx.toolResults
        .map((toolResult) => `[Tool Result] ${toolResult.outputJson}`)
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

    return this.claudeService.analyzeResults(
      messages,
      CLAUDE_PROMPTS.ANALYZE_RESULTS_SYSTEM,
    );
  }

  async stream(
    ctx: AnswerContext,
    onDelta: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = ctx.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (ctx.toolCalls.length > 0) {
      const toolCallText = ctx.toolCalls
        .map((toolCall) => `[Tool Call] ${toolCall.name}(${toolCall.argsJson})`)
        .join('\n');

      const toolResultText = ctx.toolResults
        .map((toolResult) => `[Tool Result] ${toolResult.outputJson}`)
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

    return this.claudeService.streamAnalyzeResults(
      messages,
      CLAUDE_PROMPTS.ANALYZE_RESULTS_SYSTEM,
      onDelta,
      signal,
    );
  }
}
