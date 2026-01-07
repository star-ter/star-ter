import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiRepository } from './ai.repository';
import { ToolsRepository } from './tools.repository';
import { AiToolsService } from './ai-tools.service';
import { OpenAiService } from './openAI/openAI.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    AiRepository,
    ToolsRepository,
    AiToolsService,
    OpenAiService,
  ],
})
export class AiModule {}
