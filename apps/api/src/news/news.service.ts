import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

export interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
  image?: string;
}

export interface NaverNewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NewsItem[];
}

@Injectable()
export class NewsService {
  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async resolveLocationName(region: string): Promise<string> {
    if (!/^\d+$/.test(region)) {
      return region;
    }

    try {
      const commercialArea = await this.prisma.$queryRaw<
        { adstrd_cd_: string; trdar_cd_n: string }[]
      >`
        SELECT adstrd_cd_, trdar_cd_n 
        FROM seoul_commercial_area_grid 
        WHERE trdar_cd::text LIKE ${region + '%'}
        LIMIT 1
      `;

      if (commercialArea.length === 0) {
        return region;
      }

      const { adstrd_cd_: adstrdCd, trdar_cd_n: commercialName } =
        commercialArea[0];

      if (adstrdCd) {
        const dongInfo = await this.prisma.adminAreaDong.findFirst({
          where: { adstrd_cd: adstrdCd },
          select: { adm_nm: true },
        });

        if (dongInfo?.adm_nm) {
          return dongInfo.adm_nm;
        }

        if (isNaN(Number(adstrdCd))) {
          return adstrdCd;
        }
      }

      if (commercialName) {
        return commercialName;
      }
    } catch (error) {
      console.error('Failed to resolve location name:', error);
    }

    return region;
  }

  async getNews(
    region: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<NaverNewsResponse> {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Naver API credentials not configured',
      );
    }

    // 상권 코드 지역명 변환
    const searchKeyword = await this.resolveLocationName(region);

    // 여기서 검색어 바꾸기
    const query = `"${searchKeyword}" 소상공인 상권`;

    // 네이버 API start 파라미터 계산 (1-based index)
    // page 1 -> start 1
    // page 2 -> start 6 (limit 5일 때)
    const start = (page - 1) * limit + 1;

    // 네이버 API는 start 최대값이 1000, display 최대값이 100
    // 안전장치 추가 가능하지만 일단 그대로 전달
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
      query,
    )}&display=${limit}&start=${start}&sort=sim`;

    try {
      const response = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      });

      if (!response.ok) {
        throw new InternalServerErrorException(
          `Naver API error: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as NaverNewsResponse;

      // [추가] 각 뉴스 링크에서 og:image 스크래핑 (병렬 처리)
      const itemsWithImages = await Promise.all(
        data.items.map(async (item) => {
          try {
            // 2초 타임아웃 설정
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const htmlRes = await fetch(item.originallink || item.link, {
              signal: controller.signal,
              headers: {
                // 일반 브라우저인 척 User-Agent 설정
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });
            clearTimeout(timeoutId);

            if (!htmlRes.ok) return item;

            const html = await htmlRes.text();

            // Regex로 <meta property="og:image" content="..."> 찾기
            const match = html.match(
              /<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i,
            );

            if (match && match[1]) {
              // HTML 엔티티 디코딩이 필요할 수 있으나, 보통 URL은 그대로 옴
              return { ...item, image: match[1] };
            }
          } catch {
            // 스크래핑 실패 시 이미지는 없이 원본만 리턴
            // console.error(`Failed to scrape image for ${item.link}`, e);
          }
          return item;
        }),
      );

      return {
        ...data,
        items: itemsWithImages,
      };
    } catch (error) {
      console.error('Error fetching Naver news:', error);
      throw new InternalServerErrorException('Failed to fetch news');
    }
  }
}
