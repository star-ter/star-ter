import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import OpenAI from 'openai';
import { ResolveNavigationDto } from './dto/resolve-navigation.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chatkit/session')
  async createChatkitSession() {
    const client = new OpenAI();
    const chatSession = await client.beta.chatkit.sessions.create({
      user: 'user',
      workflow: {
        id: 'wf_69533fedca4c81908675b0c946c733ae02d977f7b4a9cf1a',
        version: 'draft',
      },
    });
    return { client_secret: chatSession.client_secret };
  }

  @Post('resolve-navigation')
  async resolveNavigation(@Body() body: ResolveNavigationDto) {
    return await this.aiService.resolveNavigation(body);
  }
}
