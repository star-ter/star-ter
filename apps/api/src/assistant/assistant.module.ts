/**
 * Assistant Module - Claude 기반 채팅 NestJS 모듈
 */
import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ClaudeService } from './claude.service';

// ai 폴더에서 필요한 서비스 재사용
import { AiRepository } from '../ai/ai.repository';
import { AiToolsService } from '../ai/ai-tools.service';
import { AiResponseProcessor } from '../ai/ai-response.processor';
import { ToolsRepository } from '../ai/tools.repository';
import { OpenAiService } from '../ai/openAI/open-ai.service';
import { LocationRecommendModule } from '../location-recommend/location-recommend.module';

@Module({
  imports: [LocationRecommendModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    ClaudeService,
    // ai 폴더에서 재사용
    AiRepository,
    AiToolsService,
    AiResponseProcessor,
    ToolsRepository,
    OpenAiService,
  ],
  exports: [AssistantService],
})
export class AssistantModule {
  constructor() {
    console.log('[AssistantModule] Claude Assistant Module loaded');
  }
}
