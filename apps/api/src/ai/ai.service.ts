import { Injectable, Logger } from '@nestjs/common';
import {
  analyzeSqlResults,
  embedText,
  getCategoryByMessage,
  getLocationByMessage,
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

    const [categories, areaList] = await Promise.all([
      this.getCategories(message),
      this.buildAreaList(message),
    ]);

    const sql = getText(await nlToSql(message, categories, areaList));
    console.log('Generated SQL:', sql);
    const results = await this.aiRepository.runSql(sql);

    const analyzedResponse = await analyzeSqlResults(message, results);
    const returnMessage = getText(analyzedResponse);

    this.logger.log(
      `Total time taken to get AI message: ${(Date.now() - startTime) / 1000} s`,
    );

    return returnMessage;
  }

  private async getAreaList(message: string) {
    const areaText = getText(await getLocationByMessage(message));
    if (areaText === '""') return [];
    const areaList = areaText.split(',').map((area) => area.trim());
    return areaList;
  }

  private async buildAreaList(message: string) {
    const messageAreaList = await this.getAreaList(message);

    const results = await Promise.all(
      messageAreaList.map(async (area) => {
        const areaVector = await embedText(area);
        const [first] = await this.aiRepository.areaSearchByVector(
          areaVector.data[0].embedding,
          1,
        );
        return first;
      }),
    );
    return results;
  }

  private async getCategories(message: string) {
    const categoryResponse = await getCategoryByMessage(message);
    if (getText(categoryResponse) === '""') return [];
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
