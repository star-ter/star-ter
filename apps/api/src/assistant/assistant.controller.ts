/**
 * Assistant Controller - Claude 기반 채팅 API 엔드포인트
 */
import {
  Controller,
  Logger,
  Post,
  Body,
  RequestTimeoutException,
} from '@nestjs/common';
import { AssistantService } from './assistant.service';

@Controller('assistant')
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(private readonly assistantService: AssistantService) {}

  /**
   * 대화 히스토리 포함 채팅 엔드포인트
   * POST /assistant/message
   */
  @Post('/message')
  async chatWithHistory(
    @Body()
    body: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
  ) {
    const startTime = Date.now();
    this.logger.log(
      `[Claude] Received: ${body.message} (${body.history?.length || 0} history)`,
    );

    // 50초 타임아웃
    const TIMEOUT_MS = 50000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new RequestTimeoutException('Claude 응답 시간 초과 (50초 제한)'),
          ),
        TIMEOUT_MS,
      ),
    );

    try {
      const response = await Promise.race([
        this.assistantService.getMessageWithHistory(
          body.message,
          body.history || [],
        ),
        timeoutPromise,
      ]);

      this.logger.log(`[Claude] Response time: ${Date.now() - startTime} ms`);
      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[Claude] Error: ${err.message}`);
      throw error;
    }
  }
}
