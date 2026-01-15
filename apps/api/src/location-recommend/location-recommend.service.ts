import { Injectable, NotFoundException } from '@nestjs/common';
import { RecommendRequestDto } from './dto/recommend-request.dto';
import {
  RecommendResponseDto,
  ScoredLocation,
} from './dto/recommend-response.dto';
import { SingleRecommendResponseDto } from './dto/single-recommend-response.dto';
import { AgeScoreCalculator } from './calculators/age-score.calculator';
import { TimeScoreCalculator } from './calculators/time-score.calculator';
import { RentScoreCalculator } from './calculators/rent-score.calculator';
import { RegionScoreCalculator } from './calculators/region-score.calculator';
import { IndustryScoreCalculator } from './calculators/industry-score.calculator';
import {
  RentRepository,
  CommercialRentData,
} from './repositories/rent.repository';
import { PopulationRepository } from './repositories/region.repository';
import { SalesRepository } from './repositories/sales.repository';
import {
  WEIGHTS_WITH_INDUSTRY,
  WEIGHTS_WITHOUT_INDUSTRY,
} from './constants/weights';
import * as industryMapping from '../market/data/mapping_category_byksicNm.json';
import { SalesData } from './calculators/age-score.calculator';
import { TimeSalesData } from './calculators/time-score.calculator';
import { RegionData } from './repositories/region.repository';
import { UsersService } from '../user/user.service';

export type ScoringSalesInput = SalesData & TimeSalesData;

@Injectable()
export class LocationRecommendService {
  private ageCalculator = new AgeScoreCalculator();
  private timeCalculator = new TimeScoreCalculator();
  private rentCalculator = new RentScoreCalculator();
  private regionCalculator = new RegionScoreCalculator();
  private industryCalculator = new IndustryScoreCalculator();

  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly rentRepository: RentRepository,
    private readonly populationRepository: PopulationRepository,
    private readonly usersService: UsersService,
  ) {}

  async getRecommendations(
    dto: RecommendRequestDto,
  ): Promise<RecommendResponseDto> {
    const hasIndustry = Boolean(dto.industryCode);

    // 1. 병렬로 전체 데이터 조회 (성능 최적화)
    const [
      salesData,
      rentDataList,
      regionDataList,
      industrySalesResult,
      industryDensityResult,
      globalMaxFootTraffic,
      globalIndustryBenchmarks,
    ] = await Promise.all([
      // 상권별 매출 데이터 (SQL GROUP BY로 집계)
      this.salesRepository.getAggregatedSalesByQuarter('20253'),
      // 상권별 임대료 데이터 (PostGIS 공간 조인)
      this.rentRepository.getAllCommercialRents(),
      // 상권별 인구/시설 데이터 (SQL GROUP BY로 집계)
      this.populationRepository.getRegionDataByQuarter('20253'),
      // 상권별 특정 업종 매출 데이터 (업종 선택시에만)
      hasIndustry
        ? this.salesRepository.getIndustrySalesByQuarter(
            '20253',
            dto.industryCode!,
          )
        : Promise.resolve({
            salesMap: new Map<string, number>(),
            avgIndustrySales: 0,
          }),
      // 상권별 특정 업종 밀도 데이터 (업종 선택시에만)
      hasIndustry
        ? this.salesRepository.getIndustryDensityByQuarter(
            '20253',
            dto.industryCode!,
          )
        : Promise.resolve({
            densityMap: new Map<
              string,
              { storeCount: number; areaSize: number; density: number }
            >(),
            avgDensity: 0,
          }),
      this.populationRepository.getGlobalMaxFootTraffic('20253'),
      hasIndustry
        ? this.salesRepository.getGlobalIndustryBenchmarks(
            '20253',
            dto.industryCode!,
          )
        : Promise.resolve({
            avgIndustrySales: 0,
            avgDensity: 0,
          }),
    ]);

    // 임대료 Map 생성
    const rentDataMap = new Map<string, CommercialRentData>();
    rentDataList.forEach((rent) => {
      rentDataMap.set(rent.trdar_cd, rent);
    });

    // 인구/시설 Map 생성
    const regionDataMap = new Map(regionDataList.map((r) => [r.trdar_cd, r]));

    // 업종 매출
    const { salesMap: industrySalesMap } = industrySalesResult;

    // 업종 밀도
    const { densityMap: industryDensityMap } = industryDensityResult;

    const maxFootTraffic = globalMaxFootTraffic;
    const { avgIndustrySales, avgDensity } = globalIndustryBenchmarks;

    // 가중치 선택 (업종 유무에 따라)
    const weights = hasIndustry
      ? WEIGHTS_WITH_INDUSTRY
      : WEIGHTS_WITHOUT_INDUSTRY;

    // 2. 각 상권에 대해 점수 계산
    const scoredLocations: ScoredLocation[] = salesData.map((sales) => {
      // Age Score
      const ageScore = this.ageCalculator.calculate(
        {
          thsmon_selng_amt: sales.thsmon_selng_amt,
          agrde_10_selng_amt: sales.agrde_10_selng_amt,
          agrde_20_selng_amt: sales.agrde_20_selng_amt,
          agrde_30_selng_amt: sales.agrde_30_selng_amt,
          agrde_40_selng_amt: sales.agrde_40_selng_amt,
          agrde_50_selng_amt: sales.agrde_50_selng_amt,
          agrde_60_above_selng_amt: sales.agrde_60_above_selng_amt,
        },
        dto.age,
      );

      // Time Score
      const timeScore = this.timeCalculator.calculate(
        {
          thsmon_selng_amt: sales.thsmon_selng_amt,
          tmzon_00_06_selng_amt: sales.tmzon_00_06_selng_amt,
          tmzon_06_11_selng_amt: sales.tmzon_06_11_selng_amt,
          tmzon_11_14_selng_amt: sales.tmzon_11_14_selng_amt,
          tmzon_14_17_selng_amt: sales.tmzon_14_17_selng_amt,
          tmzon_17_21_selng_amt: sales.tmzon_17_21_selng_amt,
          tmzon_21_24_selng_amt: sales.tmzon_21_24_selng_amt,
        },
        dto.operatingTime,
      );

      // Region Score (실제 인구/시설 데이터 사용)
      const regionData = regionDataMap.get(sales.trdar_cd);
      const regionScore = this.regionCalculator.calculate(
        dto.region,
        regionData,
        maxFootTraffic,
      );

      // Rent Score (실제 임대료 데이터 사용)
      const rentData = rentDataMap.get(sales.trdar_cd);
      const rentScore = this.rentCalculator.calculate(
        dto.capital,
        rentData?.avg_deposit ?? null,
        rentData?.avg_rent ?? null,
      );

      // Industry Score (업종 선택시에만 계산 - 밀도 포함)
      let industryScore = 0;
      if (hasIndustry) {
        const totalSales = Number(sales.thsmon_selng_amt || 0);
        const industrySales = industrySalesMap.get(sales.trdar_cd) || 0;
        const densityData = industryDensityMap.get(sales.trdar_cd);
        const density = densityData?.density || 0;

        industryScore = this.industryCalculator.calculate(
          totalSales,
          industrySales,
          avgIndustrySales,
          density,
          avgDensity,
        );
      }

      // Total Score (가중 합산)
      let totalScore =
        ageScore * weights.age +
        regionScore * weights.region +
        timeScore * weights.time +
        rentScore * weights.rent;

      // 업종 점수 추가 (업종 선택시에만)
      if (hasIndustry && 'industry' in weights) {
        totalScore += industryScore * weights.industry;
      }

      return {
        id: sales.trdar_cd,
        name: sales.trdar_cd_nm || sales.trdar_cd,
        totalScore: Math.round(totalScore * 10) / 10,
        scores: {
          age: Math.round(ageScore * 100) / 100,
          region: Math.round(regionScore * 100) / 100,
          time: Math.round(timeScore * 100) / 100,
          rent: Math.round(rentScore * 100) / 100,
          industry: hasIndustry ? Math.round(industryScore * 100) / 100 : null,
        },
      };
    });

    // 3. 총점 기준 정렬
    scoredLocations.sort((a, b) => b.totalScore - a.totalScore);

    return {
      locations: scoredLocations.slice(0, 20),
    };
  }

  /**
   * 단일 상권에 대한 점수 + 설명 반환
   */
  async getSingleLocationScore(
    trdarCd: string,
    userId: string,
  ): Promise<SingleRecommendResponseDto> {
    // 1. 사용자 온보딩 정보 조회
    const userPrefs = await this.usersService.getOnboarding(userId);
    if (!userPrefs || !userPrefs.completed) {
      throw new NotFoundException('온보딩 정보가 없습니다.');
    }

    const preferences: RecommendRequestDto = {
      age: userPrefs.age || '20s',
      region: userPrefs.region || 'commercial',
      operatingTime: userPrefs.operatingTime || 'allday',
      capital: userPrefs.capital || '50M',
      industryCode: userPrefs.industryCode || undefined,
    };

    const hasIndustry = Boolean(preferences.industryCode);

    // 2. 해당 상권 데이터 조회 (병렬 실행)
    const [
      salesDataList,
      rentDataList,
      regionDataList,
      industrySalesResult,
      industryDensityResult,
      globalIndustryBenchmarks,
    ] = await Promise.all([
      this.salesRepository.getAggregatedSalesByQuarter('20253'),
      this.rentRepository.getAllCommercialRents(),
      this.populationRepository.getRegionDataByQuarter('20253'),
      hasIndustry
        ? this.salesRepository.getIndustrySalesByQuarter(
            '20253',
            preferences.industryCode!,
          )
        : Promise.resolve({
            salesMap: new Map<string, number>(),
            avgIndustrySales: 0,
          }),
      hasIndustry
        ? this.salesRepository.getIndustryDensityByQuarter(
            '20253',
            preferences.industryCode!,
          )
        : Promise.resolve({
            densityMap: new Map<
              string,
              { storeCount: number; areaSize: number; density: number }
            >(),
            avgDensity: 0,
          }),
      hasIndustry
        ? this.salesRepository.getGlobalIndustryBenchmarks(
            '20253',
            preferences.industryCode!,
          )
        : Promise.resolve({ avgIndustrySales: 0, avgDensity: 0 }),
    ]);

    // 해당 상권 찾기
    const salesData = salesDataList.find((s) => s.trdar_cd === trdarCd);
    if (!salesData) {
      throw new NotFoundException('상권을 찾을 수 없습니다.');
    }

    const rentData = rentDataList.find((r) => r.trdar_cd === trdarCd);
    const regionData = regionDataList.find((r) => r.trdar_cd === trdarCd);

    // 3. 점수 + 설명 계산
    const ageResult = this.ageCalculator.calculateWithExplanation(
      {
        thsmon_selng_amt: salesData.thsmon_selng_amt,
        agrde_10_selng_amt: salesData.agrde_10_selng_amt,
        agrde_20_selng_amt: salesData.agrde_20_selng_amt,
        agrde_30_selng_amt: salesData.agrde_30_selng_amt,
        agrde_40_selng_amt: salesData.agrde_40_selng_amt,
        agrde_50_selng_amt: salesData.agrde_50_selng_amt,
        agrde_60_above_selng_amt: salesData.agrde_60_above_selng_amt,
      },
      preferences.age,
    );

    const timeResult = this.timeCalculator.calculateWithExplanation(
      {
        thsmon_selng_amt: salesData.thsmon_selng_amt,
        tmzon_00_06_selng_amt: salesData.tmzon_00_06_selng_amt,
        tmzon_06_11_selng_amt: salesData.tmzon_06_11_selng_amt,
        tmzon_11_14_selng_amt: salesData.tmzon_11_14_selng_amt,
        tmzon_14_17_selng_amt: salesData.tmzon_14_17_selng_amt,
        tmzon_17_21_selng_amt: salesData.tmzon_17_21_selng_amt,
        tmzon_21_24_selng_amt: salesData.tmzon_21_24_selng_amt,
      },
      preferences.operatingTime,
    );

    const regionResult = this.regionCalculator.calculateWithExplanation(
      preferences.region,
      regionData,
    );

    const rentResult = this.rentCalculator.calculateWithExplanation(
      preferences.capital,
      rentData?.avg_deposit ?? null,
      rentData?.avg_rent ?? null,
    );

    // 업종 점수 (선택시에만)
    let industryResult: { score: number; explanation: string } | null = null;
    if (hasIndustry) {
      const { salesMap } = industrySalesResult;
      const { densityMap } = industryDensityResult;
      const { avgIndustrySales, avgDensity } = globalIndustryBenchmarks;
      const industrySales = salesMap.get(trdarCd) || 0;
      const densityData = densityMap.get(trdarCd);
      const density = densityData?.density || 0;
      const storeCount = densityData?.storeCount || 0;

      industryResult = this.industryCalculator.calculateWithExplanation(
        Number(salesData.thsmon_selng_amt || 0),
        industrySales,
        avgIndustrySales,
        density,
        avgDensity,
        storeCount,
      );
    }

    // 4. 총점 계산
    const weights = hasIndustry
      ? WEIGHTS_WITH_INDUSTRY
      : WEIGHTS_WITHOUT_INDUSTRY;
    let totalScore =
      ageResult.score * weights.age +
      regionResult.score * weights.region +
      timeResult.score * weights.time +
      rentResult.score * weights.rent;

    if (hasIndustry && industryResult && 'industry' in weights) {
      totalScore += industryResult.score * weights.industry;
    }

    return {
      trdarCd,
      name: salesData.trdar_cd_nm || trdarCd,
      totalScore: Math.round(totalScore * 10) / 10,
      scores: {
        age: {
          score: Math.round(ageResult.score * 100) / 100,
          explanation: ageResult.explanation,
          breakdown: ageResult.breakdown,
        },
        region: {
          score: Math.round(regionResult.score * 100) / 100,
          explanation: regionResult.explanation,
          details: regionResult.details,
        },
        time: {
          score: Math.round(timeResult.score * 100) / 100,
          explanation: timeResult.explanation,
          breakdown: timeResult.breakdown,
          selectedTime: timeResult.selectedTime,
        },
        rent: {
          score: Math.round(rentResult.score * 100) / 100,
          explanation: rentResult.explanation,
        },
        industry: industryResult
          ? {
              score: Math.round(industryResult.score * 100) / 100,
              explanation: industryResult.explanation,
            }
          : null,
      },
      userPreferences: {
        age: preferences.age,
        region: preferences.region,
        operatingTime: preferences.operatingTime,
        capital: preferences.capital,
        industryCode: preferences.industryCode || null,
      },
      businessMetrics: (() => {
        // DB 단위 변환: 천원 → 원
        const depositWon = (rentData?.avg_deposit || 0) * 1000;
        const monthlyRentWon = (rentData?.avg_rent || 0) * 1000;

        // 업종명 조회
        const industryMappingData = preferences.industryCode
          ? (industryMapping as Record<string, { name: string }>)[
              preferences.industryCode
            ]
          : null;
        const industryName =
          industryMappingData?.name || preferences.industryCode || '전체 업종';

        return {
          // 분기 매출 → 월간 환산 (/3)
          totalRevenue: Number(salesData.thsmon_selng_amt || 0) / 3,
          industryRevenue: hasIndustry
            ? (industrySalesResult.salesMap.get(trdarCd) || 0) / 3
            : 0,
          competitorCount: hasIndustry
            ? industryDensityResult.densityMap.get(trdarCd)?.storeCount || 0
            : 0,
          startupCost: {
            total: depositWon + monthlyRentWon * 12,
            deposit: depositWon,
            monthlyRent: monthlyRentWon,
          },
          appliedIndustryName: industryName,
        };
      })(),
    };
  }

  // 단일 상권에 대한 매칭 점수 계산 (AnalysisService 재활용)
  calculateRecommendationScore(
    salesData: ScoringSalesInput,
    regionData: RegionData | undefined,
    rentData: Partial<CommercialRentData> | null | undefined,
    benchmarks: {
      maxFootTraffic: number;
      avgIndustrySales: number;
      avgDensity: number;
    },
    preferences: RecommendRequestDto,
    industryData?: {
      sales: number;
      density: number;
    },
  ): number {
    const hasIndustry = Boolean(preferences.industryCode);
    const weights = hasIndustry
      ? WEIGHTS_WITH_INDUSTRY
      : WEIGHTS_WITHOUT_INDUSTRY;

    const ageScore = this.ageCalculator.calculate(
      {
        thsmon_selng_amt: salesData.thsmon_selng_amt,
        agrde_10_selng_amt: salesData.agrde_10_selng_amt,
        agrde_20_selng_amt: salesData.agrde_20_selng_amt,
        agrde_30_selng_amt: salesData.agrde_30_selng_amt,
        agrde_40_selng_amt: salesData.agrde_40_selng_amt,
        agrde_50_selng_amt: salesData.agrde_50_selng_amt,
        agrde_60_above_selng_amt: salesData.agrde_60_above_selng_amt,
      },
      preferences.age,
    );

    const timeScore = this.timeCalculator.calculate(
      {
        thsmon_selng_amt: salesData.thsmon_selng_amt,
        tmzon_00_06_selng_amt: salesData.tmzon_00_06_selng_amt,
        tmzon_06_11_selng_amt: salesData.tmzon_06_11_selng_amt,
        tmzon_11_14_selng_amt: salesData.tmzon_11_14_selng_amt,
        tmzon_14_17_selng_amt: salesData.tmzon_14_17_selng_amt,
        tmzon_17_21_selng_amt: salesData.tmzon_17_21_selng_amt,
        tmzon_21_24_selng_amt: salesData.tmzon_21_24_selng_amt,
      },
      preferences.operatingTime,
    );

    const regionScore = this.regionCalculator.calculate(
      preferences.region,
      regionData,
      benchmarks.maxFootTraffic,
    );

    const rentScore = this.rentCalculator.calculate(
      preferences.capital,
      rentData?.avg_deposit ?? null,
      rentData?.avg_rent ?? null,
    );

    let industryScore = 0;
    if (hasIndustry && industryData) {
      industryScore = this.industryCalculator.calculate(
        Number(salesData.thsmon_selng_amt || 0),
        industryData.sales,
        benchmarks.avgIndustrySales,
        industryData.density,
        benchmarks.avgDensity,
      );
    }

    let totalScore =
      ageScore * weights.age +
      regionScore * weights.region +
      timeScore * weights.time +
      rentScore * weights.rent;

    if (hasIndustry && 'industry' in weights) {
      totalScore += industryScore * weights.industry;
    }

    return Math.round(totalScore * 10) / 10;
  }
}
