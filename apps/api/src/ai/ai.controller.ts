import { Controller, Get, Logger, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);
  constructor(private readonly aiService: AiService) {}

  @Get('/message')
  async chatAI(@Query('message') message: string) {
    const startTime = Date.now();
    this.logger.log(`Received message: ${message}`);

    const response = await this.aiService.getAIMessage(message);

    const endTime = Date.now();
    this.logger.log(
      `Response time: ${endTime - startTime} ms, Response: ${response}`,
    );

    return response;
  }
}
