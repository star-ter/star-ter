import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ChatController } from './chat.controller';
import { AiRepository } from './ai.repository';
import { ToolsRepository } from './tools.repository';
import { AiToolsService } from './ai-tools.service';
import { AiResponseProcessor } from './ai-response.processor';
import { OpenAiService } from './openAI/open-ai.service';
import { LocationRecommendModule } from '../location-recommend/location-recommend.module';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [LocationRecommendModule],
  controllers: [AiController, ChatController],
  providers: [
    AiService,
    AiRepository,
    ToolsRepository,
    AiToolsService,
    AiResponseProcessor,
    OpenAiService,
    ChatRepository,
    ChatService,
  ],
  exports: [AiService, AiRepository],
})
export class AiModule {}
