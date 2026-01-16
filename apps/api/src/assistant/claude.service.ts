/**
 * Claude Service - Anthropic Claude SDK 래퍼
 * Tool Calling과 결과 분석을 담당
 */
import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  AreaVectorDto,
  BusinessCategoryVectorDto,
} from '../ai/dto/column-vector';

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
   * output_format을 사용하여 JSON 출력을 강제 (Structured Outputs)
   */
  async analyzeResults(
    messages: Anthropic.MessageParam[],
    systemPrompt: string,
  ): Promise<string> {
    // Structured Outputs를 위한 JSON 스키마 정의
    const responseSchema = {
      type: 'object' as const,
      properties: {
        reply: {
          type: 'string',
          description: '사용자에게 보여줄 응답 텍스트 (마크다운 가능)',
        },
        actions: {
          type: 'array',
          description: '호출된 Tool에 따라 필수로 추가해야 하는 UI 액션',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'chart.survival',
                  'chart.revenue',
                  'chart.breakeven',
                  'list.similar_areas',
                  'list.listings',
                  'ui.open_panel',
                ],
                description: 'action 타입',
              },
              payload: {
                type: 'object',
                properties: {
                  areaCode: {
                    type: 'string',
                    description: 'Tool의 areaCd 값 복사',
                  },
                  industryCode: {
                    type: 'string',
                    description: 'Tool의 categoryCode 값 복사',
                  },
                  lat: { type: 'number', description: '위도' },
                  lng: { type: 'number', description: '경도' },
                },
                additionalProperties: false,
              },
            },
            required: ['type', 'payload'],
            additionalProperties: false,
          },
        },
      },
      required: ['reply', 'actions'],
      additionalProperties: false,
    };

    // beta API 사용 (structured-outputs)
    const response = await this.client.beta.messages.create({
      model: this.MODEL,
      max_tokens: 2000,
      betas: ['structured-outputs-2025-11-13'],
      system: systemPrompt,
      messages,
      output_format: {
        type: 'json_schema',
        schema: responseSchema,
      },
    });

    console.log(`[ClaudeService] Analyze stop_reason: ${response.stop_reason}`);
    console.log(`[ClaudeService] Usage:`, response.usage);

    // output_format 사용 시 응답은 text 블록에 JSON으로 반환됨
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    if (textBlock?.text) {
      console.log(
        '[ClaudeService] Structured output received:',
        textBlock.text.substring(0, 200),
      );
      return textBlock.text;
    }

    // Fallback
    return JSON.stringify({ reply: '응답을 생성할 수 없습니다.', actions: [] });
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
