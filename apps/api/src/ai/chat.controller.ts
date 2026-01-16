import {
  Controller,
  Logger,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { User } from 'src/auth/decorators/user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticatedUser';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(private readonly chatService: ChatService) {}

  // 대화 히스토리 포함 POST 엔드포인트 (꼬리 질문 지원)
  @UseGuards(JwtAuthGuard)
  @Post('/send')
  async chatAIWithHistory(
    @User() user: AuthenticatedUser,
    @Body()
    body: {
      message: string;
      conversationId?: string;
    },
  ) {
    const startTime = Date.now();
    this.logger.log(
      `Received message with history: ${body.message} (${body.conversationId || 'none'} previous messages)`,
    );
    const response = await this.chatService.handleChatMessage(
      user.id,
      body.conversationId || null,
      body.message,
    );

    this.logger.log(`Response time: ${Date.now() - startTime} ms`);
    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/conversations')
  async getUserConversations(@User() user: AuthenticatedUser) {
    return this.chatService.getUserConversations(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/conversation/history/:id')
  async getConversationHistory(
    @User() user: AuthenticatedUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationHistory(user.id, conversationId);
  }
}
