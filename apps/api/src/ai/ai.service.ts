import { Injectable, Logger } from '@nestjs/common';
import {
  analyzeSqlResults,
  chatToVectorSearchWords,
  embedText,
  getCategoryByMessage,
  getText,
  nlToSql,
} from './openAI/openAI';
import { AiRepository } from './ai.repository';
import { BusinessCategoryVectorDto } from './dto/column-vector';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(private readonly aiRepository: AiRepository) {}

  async getAIMessage(message: string): Promise<string> {
    const startTime = Date.now();

    const [similarColumns, categories] = await Promise.all([
      this.getSimilarColumns(message),
      this.getCategories(message),
    ]);

    this.logger.log(
      `Time taken to get similar columns and categories: ${
        (Date.now() - startTime) / 1000
      } s`,
    );

    const sql = getText(await nlToSql(message, similarColumns, categories));
    const results = await this.aiRepository.runSql(sql);

    this.logger.log(
      `Time taken to run SQL and get results: ${
        (Date.now() - startTime) / 1000
      } s`,
    );

    const analyzedResponse = await analyzeSqlResults(message, results);
    const returnMessage = getText(analyzedResponse);

    this.logger.log(
      `Total time taken to get AI message: ${(Date.now() - startTime) / 1000} s`,
    );

    return returnMessage;
  }

  private async getSimilarColumns(message: string) {
    const vectorSearchWordsResponse = await chatToVectorSearchWords(message);
    const vectorSearchWords = getText(vectorSearchWordsResponse);

    const vector = await embedText(vectorSearchWords);
    const embedding = vector.data[0].embedding;

    return this.aiRepository.columnsSearchByVector(embedding, 30);
  }

  private async getCategories(message: string) {
    const categoryResponse = await getCategoryByMessage(message);
    const categories = getText(categoryResponse)
      .split(',')
      .map((cat) => cat.trim());

    let categoryList: BusinessCategoryVectorDto[] = [];
    for (const category of categories) {
      const categoryVector = await embedText(category);
      const categoryResults = await this.aiRepository.categorySearchByVector(
        categoryVector.data[0].embedding,
        5,
      );
      categoryList = categoryList.concat(categoryResults);
    }
    return categoryList;
  }
}
