import {
  Controller,
  Get,
  Logger,
  Query,
  Post,
  Body,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);
  constructor(private readonly aiService: AiService) {}

  // 기존 GET 엔드포인트 (하위 호환성 유지)
  @Get('/message')
  async chatAI(@Query('message') message: string) {
    const startTime = Date.now();
    this.logger.log(`Received message: ${message}`);
    const response = await this.aiService.getAIMessage(message);
    this.logger.log(`Response time: ${Date.now() - startTime} ms`);
    return response;
  }

  // 대화 히스토리 포함 POST 엔드포인트 (꼬리 질문 지원)
  @Post('/message')
  async chatAIWithHistory(
    @Body()
    body: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
  ) {
    const startTime = Date.now();
    this.logger.log(
      `Received message with history: ${body.message} (${body.history?.length || 0} previous messages)`,
    );
    const response = await this.aiService.getAIMessageWithHistory(
      body.message,
      body.history || [],
    );
    this.logger.log(`Response time: ${Date.now() - startTime} ms`);
    return response;
  }

  @Get('/area')
  async getAreaByMessage(@Query('message') message: string) {
    return this.aiService.getAreaByMessage(message);
  }

  @Post('/analyze')
  async analyze(
    @Body('topic') topic: string,
    @Body('areaName') areaName: string,
    @Body('metrics') metrics: string,
  ) {
    return this.aiService.getAnalysis(topic, areaName, metrics);
  }

  @Post('/real-estate-summary')
  async getRealEstateSummary(@Body('metrics') metrics: string) {
    const startTime = Date.now();
    this.logger.log('Received real estate summary request');
    const response = await this.aiService.getRealEstateSummary(metrics);
    this.logger.log(
      `Real estate summary response time: ${Date.now() - startTime} ms`,
    );
    return response;
  }

  /**
   * 스트리밍 방식으로 AI 응답을 전송합니다.
   * Server-Sent Events (SSE)를 사용하여 실시간으로 텍스트 청크를 전송합니다.
   */
  @Sse('message/stream')
  chatAIWithHistoryStream(
    @Query('message') message: string,
    @Query('history') historyJson?: string,
  ): Observable<MessageEvent> {
    const startTime = Date.now();
    this.logger.log(`[SSE] Received streaming message: ${message}`);

    // Query 파라미터로 받은 history JSON 파싱
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (historyJson) {
      try {
        history = JSON.parse(historyJson) as Array<{
          role: 'user' | 'assistant';
          content: string;
        }>;
      } catch (e) {
        this.logger.warn('[SSE] Failed to parse history JSON', e);
      }
    }

    // AsyncGenerator를 Observable로 변환
    const stream = this.aiService.getAIMessageWithHistoryStream(
      message,
      history,
    );

    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        try {
          for await (const chunk of stream) {
            subscriber.next({ data: chunk } as MessageEvent);
          }
          subscriber.next({ data: '[DONE]' } as MessageEvent);
          this.logger.log(
            `[SSE] Stream complete. Time: ${Date.now() - startTime}ms`,
          );
          subscriber.complete();
        } catch (error) {
          this.logger.error('[SSE] Stream error:', error);
          subscriber.error(error);
        }
      })();
    });
  }
}
