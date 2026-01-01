import { Injectable, Logger } from '@nestjs/common';
import {
  analyzeSqlResults,
  chatToVectorSearchWords,
  embedText,
  getText,
  nlToSql,
} from './openAI/openAI';
import { AiRepository } from './ai.repository';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(private readonly aiRepository: AiRepository) {}

  async getAIMessage(message: string): Promise<string> {
    const startTime = Date.now();
    const vectorSearchWordsResponse = await chatToVectorSearchWords(message);
    const vectorSearchWords = getText(vectorSearchWordsResponse);
    this.logger.log(`Vector Search Words: ${vectorSearchWords}`);

    this.logger.log(
      `Time taken to get vector search words: ${(Date.now() - startTime) / 1000} s`,
    );

    const vector = await embedText(vectorSearchWords);
    const embedding = vector.data[0].embedding;

    this.logger.log(
      `Time taken to get embedding: ${(Date.now() - startTime) / 1000} s`,
    );

    const similarColumns = await this.aiRepository.columnsSearchByVector(
      embedding,
      30,
    );

    this.logger.log(
      `Time taken to get similar columns: ${(Date.now() - startTime) / 1000} s`,
    );

    const sql = getText(await nlToSql(message, similarColumns));
    const results = await this.aiRepository.runSql(sql);

    this.logger.log(
      `Time taken to run SQL and get results: ${(Date.now() - startTime) / 1000} s`,
    );

    const analyzedResponse = await analyzeSqlResults(results);
    const returnMessage = getText(analyzedResponse);

    this.logger.log(
      `Total time taken to get AI message: ${(Date.now() - startTime) / 1000} s`,
    );

    return returnMessage;
  }
}
