import { Controller, Get, Query } from '@nestjs/common';
import { NewsService, NaverNewsResponse } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async getNews(
    @Query('region') region: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
  ): Promise<NaverNewsResponse> {
    const targetRegion = region || '서울';
    return await this.newsService.getNews(targetRegion, page, limit);
  }
}
