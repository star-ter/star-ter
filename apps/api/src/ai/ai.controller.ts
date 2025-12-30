import { Body, Controller, Post } from '@nestjs/common';
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
        id: 'wf_6953ab3566a48190b1f760fcd765041a01ad2ee3c12c34e8',
        version: 'draft',
      },
    });
    return { client_secret: chatSession.client_secret };
  }
}
