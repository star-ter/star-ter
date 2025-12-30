import { Controller, Post } from '@nestjs/common';
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
        id: 'wf_69501d4c656c8190af011363ce9dd6220c56171567643699',
        version: '6',
      },
    });
    return { client_secret: chatSession.client_secret };
  }
}
