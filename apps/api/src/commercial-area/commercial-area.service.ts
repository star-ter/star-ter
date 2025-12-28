import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AreaDetailDto,
  AreaComparisonResponse,
  ComparisonDiffDto,
  StoreInfo,
  SalesInfo,
  FloatingPopulationInfo,
  ResidentialPopulationInfo,
  CategoryData,
} from './dto/area-comparison.dto';
import { ComparisonRequestDto } from './dto/comparison-request.dto';

@Injectable()
export class CommercialAreaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 두 상권을 비교하는 메인 메서드
   */
  async compareAreas(
    dto: ComparisonRequestDto,
  ): Promise<AreaComparisonResponse> {
    // 두 상권의 상세 정보를 병렬로 조회
    const [area1, area2] = await Promise.all([
      this.getAreaDetail(dto.areaCode1, dto.yearMonth),
      this.getAreaDetail(dto.areaCode2, dto.yearMonth),
    ]);

    // 두 상권의 차이 계산
    const diff = this.calculateDifference(area1, area2);

    return {
      comparison: {
        area1,
        area2,
        diff,
      },
    };
  }

  /**
   * 특정 상권의 상세 정보 조회
   * TODO: 실제 API 구현 필요 - 현재는 Mock 데이터 반환
   */
  private async getAreaDetail(
    areaCode: string,
    yearMonth?: string,
  ): Promise<AreaDetailDto> {
    // TODO: Prisma를 사용하여 실제 데이터베이스에서 조회
    // const area = await this.prisma.commercial_area.findUnique({
    //   where: { area_code: areaCode }
    // });

    // TODO: 업종별 점포수 조회
    const stores = await this.getStoresByCategory(areaCode, yearMonth);

    // TODO: 업종별 매출 조회
    const sales = await this.getSalesByCategory(areaCode, yearMonth);

    // TODO: 유동인구 조회
    const floatingPopulation = await this.getFloatingPopulation(
      areaCode,
      yearMonth,
    );

    // TODO: 주거인구 조회
    const residentialPopulation = await this.getResidentialPopulation(
      areaCode,
      yearMonth,
    );

    // Mock 데이터 반환 (실제 구현 시 제거)
    // 상권 코드에 따라 다른 데이터 반환
    const mockData: Record<string, { name: string; multiplier: number }> = {
      '11680': { name: '강남구', multiplier: 1.5 },
      '11110': { name: '종로구', multiplier: 1.2 },
      '11200': { name: '성동구', multiplier: 1.0 },
      '11290': { name: '성북구', multiplier: 0.9 },
      '11410': { name: '용산구', multiplier: 1.3 },
    };

    const areaInfo = mockData[areaCode] || { name: `상권 ${areaCode}`, multiplier: 1.0 };

    return {
      areaCode,
      areaName: areaInfo.name,
      polygon: [], // TODO: 실제 폴리곤 데이터 조회
      x: 127.0, // TODO: 실제 중심 좌표
      y: 37.5, // TODO: 실제 중심 좌표
      stores: {
        total: Math.round(stores.total * areaInfo.multiplier),
        byCategory: stores.byCategory.map(c => ({
          ...c,
          count: Math.round(c.count * areaInfo.multiplier),
          sales: c.sales ? Math.round(c.sales * areaInfo.multiplier) : undefined,
        })),
      },
      sales: {
        total: Math.round(sales.total * areaInfo.multiplier),
        byCategory: sales.byCategory.map(c => ({
          ...c,
          sales: c.sales ? Math.round(c.sales * areaInfo.multiplier) : undefined,
        })),
      },
      floatingPopulation: {
        total: Math.round(floatingPopulation.total * areaInfo.multiplier),
        byTimeSlot: floatingPopulation.byTimeSlot.map(t => ({
          ...t,
          count: Math.round(t.count * areaInfo.multiplier),
        })),
        byAgeGroup: floatingPopulation.byAgeGroup.map(a => ({
          ...a,
          count: Math.round(a.count * areaInfo.multiplier),
        })),
      },
      residentialPopulation: {
        total: Math.round(residentialPopulation.total * areaInfo.multiplier),
        byAgeGroup: residentialPopulation.byAgeGroup.map(a => ({
          ...a,
          count: Math.round(a.count * areaInfo.multiplier),
        })),
        households: Math.round(residentialPopulation.households * areaInfo.multiplier),
      },
    };
  }

  /**
   * 업종별 점포수 조회
   * TODO: 실제 API/DB 쿼리 구현 필요
   */
  private async getStoresByCategory(
    areaCode: string,
    yearMonth?: string,
  ): Promise<StoreInfo> {
    // TODO: 실제 데이터베이스 쿼리
    // const storesData = await this.prisma.store_by_category.findMany({
    //   where: {
    //     area_code: areaCode,
    //     year_month: yearMonth || this.getCurrentYearMonth(),
    //   },
    // });

    // Mock 데이터 - 기본값
    const byCategory: CategoryData[] = [
      { category: '음식점', count: 250, sales: 1500000000 },
      { category: '카페', count: 120, sales: 600000000 },
      { category: '소매', count: 180, sales: 900000000 },
      { category: '서비스', count: 95, sales: 450000000 },
      { category: '학원', count: 75, sales: 380000000 },
    ];

    return {
      total: byCategory.reduce((sum, item) => sum + item.count, 0),
      byCategory,
    };
  }

  /**
   * 업종별 매출 조회
   * TODO: 실제 API/DB 쿼리 구현 필요
   */
  private async getSalesByCategory(
    areaCode: string,
    yearMonth?: string,
  ): Promise<SalesInfo> {
    // TODO: 실제 데이터베이스 쿼리
    // const salesData = await this.prisma.sales_by_category.findMany({
    //   where: {
    //     area_code: areaCode,
    //     year_month: yearMonth || this.getCurrentYearMonth(),
    //   },
    // });

    // Mock 데이터
    const byCategory: CategoryData[] = [
      { category: '음식점', count: 0, sales: 1500000000 },
      { category: '카페', count: 0, sales: 600000000 },
      { category: '소매', count: 0, sales: 900000000 },
      { category: '서비스', count: 0, sales: 450000000 },
      { category: '학원', count: 0, sales: 380000000 },
    ];

    return {
      total: byCategory.reduce((sum, item) => sum + (item.sales || 0), 0),
      byCategory,
    };
  }

  /**
   * 유동인구 조회
   * TODO: 실제 API/DB 쿼리 구현 필요
   */
  private async getFloatingPopulation(
    areaCode: string,
    yearMonth?: string,
  ): Promise<FloatingPopulationInfo> {
    // TODO: 실제 데이터베이스 쿼리
    // const floatingData = await this.prisma.floating_population.findMany({
    //   where: {
    //     area_code: areaCode,
    //     year_month: yearMonth || this.getCurrentYearMonth(),
    //   },
    // });

    // Mock 데이터
    const byTimeSlot = [
      { timeSlot: '09-12', count: 5000 },
      { timeSlot: '12-15', count: 8000 },
      { timeSlot: '15-18', count: 7500 },
      { timeSlot: '18-21', count: 12000 },
      { timeSlot: '21-24', count: 6000 },
    ];

    const byAgeGroup = [
      { ageGroup: '10대', count: 3500 },
      { ageGroup: '20대', count: 12000 },
      { ageGroup: '30대', count: 10500 },
      { ageGroup: '40대', count: 8500 },
      { ageGroup: '50대+', count: 4000 },
    ];

    return {
      total: byAgeGroup.reduce((sum, item) => sum + item.count, 0),
      byTimeSlot,
      byAgeGroup,
    };
  }

  /**
   * 주거인구 조회
   * TODO: 실제 API/DB 쿼리 구현 필요
   */
  private async getResidentialPopulation(
    areaCode: string,
    yearMonth?: string,
  ): Promise<ResidentialPopulationInfo> {
    // TODO: 실제 데이터베이스 쿼리
    // const residentialData = await this.prisma.residential_population.findMany({
    //   where: {
    //     area_code: areaCode,
    //     year_month: yearMonth || this.getCurrentYearMonth(),
    //   },
    // });

    // Mock 데이터
    const byAgeGroup = [
      { ageGroup: '10대', count: 1800 },
      { ageGroup: '20대', count: 4500 },
      { ageGroup: '30대', count: 5200 },
      { ageGroup: '40대', count: 4800 },
      { ageGroup: '50대+', count: 3700 },
    ];

    return {
      total: byAgeGroup.reduce((sum, item) => sum + item.count, 0),
      byAgeGroup,
      households: 8500,
    };
  }

  /**
   * 두 상권의 차이 계산
   */
  private calculateDifference(
    area1: AreaDetailDto,
    area2: AreaDetailDto,
  ): ComparisonDiffDto {
    return {
      stores: this.calculateMetricDiff(area1.stores.total, area2.stores.total),
      sales: this.calculateMetricDiff(area1.sales.total, area2.sales.total),
      floatingPopulation: this.calculateMetricDiff(
        area1.floatingPopulation.total,
        area2.floatingPopulation.total,
      ),
      residentialPopulation: this.calculateMetricDiff(
        area1.residentialPopulation.total,
        area2.residentialPopulation.total,
      ),
    };
  }

  /**
   * 개별 메트릭 차이 계산 유틸리티
   */
  private calculateMetricDiff(
    value1: number,
    value2: number,
  ): { total: number; percentage: number } {
    const total = value1 - value2;
    const percentage = value2 !== 0 ? (total / value2) * 100 : 0;

    return {
      total,
      percentage: Math.round(percentage * 100) / 100, // 소수점 2자리
    };
  }

  /**
   * 현재 년월 반환 (YYYYMM 형식)
   * TODO: 실제 사용 시 필요에 따라 구현
   */
  private getCurrentYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  }
}
