import {
  Controller,
  Logger,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { User } from 'src/auth/decorators/user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticatedUser';
import { ChatService } from './chat.service';
import { UpdateConversationTitleDto } from './dto/update-conversation-title.dto';
import type { AiProviderName } from './core/ai-types';

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
      aiProvider?: AiProviderName;
      toolPlanner?: AiProviderName;
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
      {
        aiProvider: body.aiProvider,
        toolPlanner: body.toolPlanner,
      },
    );

    this.logger.log(`Response time: ${Date.now() - startTime} ms`);
    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/send/stream')
  async chatAIWithStream(
    @User() user: AuthenticatedUser,
    @Body()
    body: {
      message: string;
      conversationId?: string;
      aiProvider?: AiProviderName;
      toolPlanner?: AiProviderName;
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const abortController = new AbortController();
    req.on('close', () => {
      abortController.abort();
    });

    const sendEvent = (event: string, data: Record<string, unknown>) => {
      if (res.writableEnded || res.destroyed) return;
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await this.chatService.handleChatMessageStream(
        user.id,
        body.conversationId || null,
        body.message,
        {
          aiProvider: body.aiProvider,
          toolPlanner: body.toolPlanner,
        },
        sendEvent,
        abortController.signal,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Streaming failed';
      sendEvent('error', { message });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
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

  @UseGuards(JwtAuthGuard)
  @Patch('/conversation/:id/title')
  async updateConversationTitle(
    @User() user: AuthenticatedUser,
    @Param('id') conversationId: string,
    @Body() body: UpdateConversationTitleDto,
  ) {
    return this.chatService.updateConversationTitle(
      user.id,
      conversationId,
      body.title,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/conversation/:id')
  async deleteConversation(
    @User() user: AuthenticatedUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.deleteConversation(user.id, conversationId);
  }
}
