/**
 * Assistant Controller - Claude 기반 채팅 API 엔드포인트
 */
import {
  Controller,
  Logger,
  Post,
  Body,
  RequestTimeoutException,
  UseGuards,
} from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { User } from 'src/auth/decorators/user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticatedUser';

@Controller('assistant')
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(private readonly assistantService: AssistantService) {}

  /**
   * 대화 히스토리 포함 채팅 엔드포인트
   * POST /assistant/message
   *
   * [변경사항]
   * - JwtAuthGuard 추가: 인증된 사용자만 접근 가능
   * - conversationId 파라미터 추가: DB 히스토리 저장용
   */
  @UseGuards(JwtAuthGuard)
  @Post('/message')
  async chatWithHistory(
    @User() user: AuthenticatedUser,
    @Body()
    body: {
      message: string;
      conversationId?: string;
      // history는 더 이상 필요 없음 (DB에서 로드)
    },
  ) {
    const startTime = Date.now();
    this.logger.log(`[Claude] Received: ${body.message}`);

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
          user.id,
          body.conversationId,
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
