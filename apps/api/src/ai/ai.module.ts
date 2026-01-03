import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiRepository } from './ai.repository';
import { ToolsRepository } from './tools.repository';

@Module({
  controllers: [AiController],
  providers: [AiService, AiRepository, ToolsRepository],
})
export class AiModule {}
