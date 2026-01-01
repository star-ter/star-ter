import { Controller, Get, Post, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import OpenAI from 'openai';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chatkit/session')
  async createChatkitSession() {
    const client = new OpenAI();
    const chatSession = await client.beta.chatkit.sessions.create({
      user: 'user',
      workflow: {
        id: 'wf_6952ba36ea588190af94165f9f6863800df828dd7d150ac7',
        version: 'draft',
      },
    });
    return { client_secret: chatSession.client_secret };
  }

  @Get('/message')
  async chatAI(@Query('message') message: string) {
    return this.aiService.getAIMessage(message);
  }
}
