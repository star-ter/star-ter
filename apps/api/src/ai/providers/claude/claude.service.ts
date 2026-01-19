/**
 * Claude Service - Anthropic Claude SDK 래퍼
 * Tool Calling과 결과 분석을 담당
 */
import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  AreaVectorDto,
  BusinessCategoryVectorDto,
} from '../../dto/column-vector';

// Claude Tool 정의 타입
interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Tool 호출 결과 타입
export interface ClaudeToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

@Injectable()
export class ClaudeService {
  private client: Anthropic;

  // Claude 모델 (빠르고 저렴한 Haiku)
  private readonly MODEL = 'claude-haiku-4-5';

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Tool Calling 수행 (1차 호출)
   * 사용자 메시지를 분석하여 적절한 Tool을 선택
   * @returns 원본 content와 추출된 toolCalls
   */
  async toolCall(
    messages: Anthropic.MessageParam[],
    systemPrompt: string,
    tools: ClaudeTool[],
  ): Promise<{
    content: Anthropic.ContentBlock[];
    toolCalls: ClaudeToolCall[];
  }> {
    const startTime = Date.now();

    const response = await this.client.messages.create({
      model: this.MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages,
      tools,
    });

    const apiTime = Date.now() - startTime;
    console.log(`[ClaudeService] 🕐 Tool Selection API Time: ${apiTime}ms`);
    console.log(
      `[ClaudeService] Tool call stop_reason: ${response.stop_reason}`,
    );
    console.log(`[ClaudeService] Usage:`, response.usage);

    // Tool 호출 추출 (tool_use 블록)
    const toolCalls: ClaudeToolCall[] = response.content
      .filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      )
      .map((block) => ({
        id: block.id,
        name: block.name,
        arguments: block.input as Record<string, unknown>,
      }));

    console.log(`[ClaudeService] Tool calls: ${toolCalls.length}`);

    // 원본 content와 추출된 toolCalls 함께 반환
    return {
      content: response.content,
      toolCalls,
    };
  }

  /**
   * 결과 분석 및 최종 응답 생성 (2차 호출)
   */
  async analyzeResults(
    messages: Anthropic.MessageParam[],
    systemPrompt: string,
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    });

    console.log(`[ClaudeService] Analyze stop_reason: ${response.stop_reason}`);
    console.log(`[ClaudeService] Usage:`, response.usage);

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    if (textBlocks.length > 0) {
      const combined = textBlocks.map((block) => block.text).join('');
      console.log(
        '[ClaudeService] Text output received:',
        combined.substring(0, 200),
      );
      return combined;
    }

    // Fallback
    return '응답을 생성할 수 없습니다.';
  }

  /**
   * 결과 분석 및 최종 응답 생성 (스트리밍)
   */
  async streamAnalyzeResults(
    messages: Anthropic.MessageParam[],
    systemPrompt: string,
    onDelta: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const stream = this.client.messages.stream(
      {
        model: this.MODEL,
        max_tokens: 2000,
        system: systemPrompt,
        messages,
      },
      signal ? { signal } : undefined,
    );

    let fullText = '';
    stream.on('text', (text) => {
      if (!text) return;
      onDelta(text);
      fullText += text;
    });

    await stream.done();

    if (!fullText) {
      try {
        fullText = await stream.finalText();
      } catch {
        // ignore
      }
    }

    return fullText;
  }

  /**
   * 업종 벡터를 프롬프트 문자열로 변환
   */
  formatCategoryVectors(categories: BusinessCategoryVectorDto[]): string {
    return categories
      .map(
        (cat) =>
          `svc_induty_cd: ${cat.code}, svc_induty_cd_nm: ${cat.categoryName}`,
      )
      .join('\n');
  }

  /**
   * 지역 벡터를 프롬프트 문자열로 변환
   */
  formatAreaVectors(areas: AreaVectorDto[]): string {
    return areas
      .map(
        (area) =>
          `area_name: ${area.areaName}, area_level: ${area.areaLevel}, area_code: ${area.areaCode}, lat: ${area.lat || 'null'}, lng: ${area.lng || 'null'}`,
      )
      .join('\n');
  }
}
