import { Controller, Logger, Get, Query } from '@nestjs/common';
import { ToolsRepository } from './tools.repository';
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);
  constructor(private readonly toolsRepository: ToolsRepository) {}

  // =========================================
  // 차트 데이터 API 엔드포인트(LLM 안에 들어가는 카드)
  // =========================================

  /**
   * 매출/수익 분석 차트 데이터
   * GET /ai/chart/revenue?areaCd=xxx&categoryCode=xxx
   */
  @Get('/chart/revenue')
  async getRevenueChartData(
    @Query('areaCd') areaCd: string,
    @Query('categoryCode') categoryCode?: string,
  ) {
    const result = await this.toolsRepository.estimateRevenueAndCost({
      areaCd,
      categoryCode: categoryCode || undefined,
    });
    return { success: true, data: result.data };
  }

  /**
   * 생존 점수 게이지 데이터
   * GET /ai/chart/survival?areaCd=xxx&categoryCode=xxx
   */
  @Get('/chart/survival')
  async getSurvivalChartData(
    @Query('areaCd') areaCd: string,
    @Query('categoryCode') categoryCode?: string,
  ) {
    const result = await this.toolsRepository.predictSurvivalRate({
      areaCd,
      categoryCode: categoryCode || undefined,
    });
    return { success: true, data: result.data };
  }

  /**
   * 손익분기 분석 차트 데이터
   * GET /ai/chart/breakeven?areaCd=xxx&categoryCode=xxx&listingId=xxx
   */
  @Get('/chart/breakeven')
  async getBreakEvenChartData(
    @Query('areaCd') areaCd?: string,
    @Query('categoryCode') categoryCode?: string,
    @Query('listingId') listingId?: string,
  ) {
    // listingId가 있으면 매물 기반, 없으면 일반 BEP
    if (listingId) {
      const result = await this.toolsRepository.calcBreakEvenWithListing({
        listingId,
        categoryCode: categoryCode || undefined,
      });
      return { success: true, data: result.data };
    } else {
      const result = await this.toolsRepository.calcBreakEven({
        areaCd,
        categoryCode: categoryCode || undefined,
      });
      return { success: true, data: result.data };
    }
  }

  /**
   * 매물 리스트 차트 데이터
   * GET /ai/chart/listings?latitude=xxx&longitude=xxx&maxDeposit=xxx&maxMonthlyRent=xxx
   */
  @Get('/chart/listings')
  async getListingsChartData(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('maxDeposit') maxDeposit?: string,
    @Query('maxMonthlyRent') maxMonthlyRent?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.toolsRepository.recommendRealEstate({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      maxDeposit: maxDeposit ? parseFloat(maxDeposit) : undefined,
      maxMonthlyRent: maxMonthlyRent ? parseFloat(maxMonthlyRent) : undefined,
      limit: limit ? parseInt(limit, 10) : 5,
    });

    // data는 직접 배열로 반환됨
    const listings = Array.isArray(result.data) ? result.data : [];
    return {
      success: true,
      data: {
        listings: listings.map((l) => ({
          id: l.id,
          title: l.title || '매물',
          address: '', // address 필드가 없으므로 빈 문자열
          deposit: (l.deposit || 0) * 10000, // 만원 -> 원 변환
          monthlyRent: (l.monthlyRent || 0) * 10000,
          size: l.size,
          floor: String(l.floor || ''),
          distance: parseFloat(l.distance) * 1000, // km -> m 변환
        })),
        totalCount: listings.length,
      },
    };
  }

  /**
   * 유사 상권 리스트 차트 데이터
   * GET /ai/chart/similar-areas?areaCd=xxx&categoryCode=xxx
   */
  @Get('/chart/similar-areas')
  async getSimilarAreasChartData(
    @Query('areaCd') areaCd: string,
    @Query('categoryCode') categoryCode?: string,
  ) {
    const result = await this.toolsRepository.findSimilarCommercialAreas({
      areaCd, // areaCodes가 아니라 areaCd
      categoryCode: categoryCode || undefined,
    });

    // data 형식을 SimilarAreasCard에 맞게 변환
    const rawData = Array.isArray(result.data) ? result.data : [];
    const targetAreaName = result.meta?.targetAreaName || areaCd;

    return {
      success: true,
      data: {
        targetAreaName,
        similarAreas: rawData.map((item) => ({
          areaCode: item.areaCd, // areaCd -> areaCode로 변환
          areaName: item.areaName,
          similarity: item.similarity * 100, // 0-1 → 0-100
          lat: typeof item.lat === 'number' ? item.lat : null,
          lng: typeof item.lng === 'number' ? item.lng : null,
        })),
      },
    };
  }

  /**
   * 상권 요약 정보 (MapInfoPanel용)
   * GET /ai/area/summary?areaCd=xxx
   */
  @Get('/area/summary')
  async getAreaSummary(@Query('areaCd') areaCd: string) {
    const stdrYyquCd = '20253'; // 최신 분기

    try {
      const result = await this.toolsRepository.getCommercialSummary({
        areaCd,
        stdrYyquCd,
      });

      if (!result || !Array.isArray(result) || result.length === 0) {
        return {
          success: false,
          message: '상권 정보를 찾을 수 없습니다.',
          data: null,
        };
      }

      const row = result[0] as Record<string, unknown>;
      return {
        success: true,
        data: {
          areaName: row['지역 이름'] as string,
          revenue: Number(row['해당 분기 매출 금액'] || 0),
          floatingPopulation: Number(row['총 유동인구'] || 0),
          storeCount: Number(row['점포 수'] || 0),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get area summary: ${error}`);
      return {
        success: false,
        message: '상권 정보 조회 중 오류가 발생했습니다.',
        data: null,
      };
    }
  }
}
