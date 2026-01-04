import { Injectable } from '@nestjs/common';
import {
  analyzeResults,
  embedText,
  getCategoryByMessage,
  getLocationByMessage,
  getText,
  toolCallAi,
} from './openAI/openAI';
import { AiRepository } from './ai.repository';
import { BusinessCategoryVectorDto } from './dto/column-vector';
import { ResponseInputItem } from 'openai/resources/responses/responses.js';
import { AiToolsService } from './ai-tools.service';

@Injectable()
export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly aiToolsService: AiToolsService,
  ) {}

  async getAIMessage(message: string): Promise<string> {
    const [categories, areaList] = await Promise.all([
      this.getCategories(message),
      this.buildAreaList(message),
    ]);

    const input: ResponseInputItem[] = [{ role: 'user', content: message }];
    const toolCallResponse = await toolCallAi(message, categories, areaList);
    input.push(...toolCallResponse.output);

    for (const toolCall of toolCallResponse.output) {
      if (toolCall.type !== 'function_call') continue;
      const toolResult = await this.aiToolsService.run(
        toolCall.name,
        toolCall.arguments,
      );
      
      if (toolResult === undefined) {
        continue;
      }

      input.push({
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify(toolResult, safeBigIntStringify),
      });
    }

    const analyzeResult = await analyzeResults(input);

    return getText(analyzeResult);
  }

  private async buildAreaList(message: string) {
    const areaText = getText(await getLocationByMessage(message));
    if (areaText === '""') return [];
    const messageAreaList = areaText.split(',').map((area) => area.trim());

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

function safeBigIntStringify(key: string, value: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof value === 'bigint' ? value.toString() : value;
}
