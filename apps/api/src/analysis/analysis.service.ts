import { Injectable } from '@nestjs/common';
import { AnalysisRepository } from './analysis.repository';
import { UsersService } from '../user/user.service';
import { AnalysisMapper } from './analysis.mapper';
import {
  LocationRecommendService,
  ScoringSalesInput,
} from '../location-recommend/location-recommend.service';
import { RecommendRequestDto } from '../location-recommend/dto/recommend-request.dto';
import { RegionData } from '../location-recommend/repositories/region.repository';
import {
  AnalysisResponse,
  AnalysisError,
  RegionSearchResult,
  IndustrySearchResult,
  ResolvedRegion,
} from './dto/analysis.types';

const INTERIOR_COST_PER_PY = 2000000; // 평당 200만원
const AVG_STORE_SIZE = 15; // 15평

interface UserPreferences extends RecommendRequestDto {
  completed: boolean;
}

@Injectable()
export class AnalysisService {
  constructor(
    private readonly repository: AnalysisRepository,
    private readonly usersService: UsersService,
    private readonly locationRecommendService: LocationRecommendService,
  ) {}

  async getAnalysis(
    regionCode: string,
  ): Promise<AnalysisResponse | AnalysisError> {
    const region = await this.resolveRegion(regionCode);
    if (!region) {
      return { error: `Region not found: ${regionCode}` };
    }

    const quarters = await this.repository.getAvailableQuarters(
      region.type,
      region.codes,
    );
    if (quarters.length === 0) {
      return { error: 'No data available for this region' };
    }

    const latestQuarter = quarters[quarters.length - 1];
    const [
      salesAgg,
      storeAgg,
      popAgg,
      workingPopAgg,
      storeGroups,
      trendGroups,
    ] = await Promise.all([
      this.repository.aggregateSales(region.type, region.codes, latestQuarter),
      this.repository.aggregateStores(region.type, region.codes, latestQuarter),
      this.repository.aggregatePopulation(
        region.type,
        region.codes,
        latestQuarter,
      ),
      this.repository.aggregateWorkingPopulation(
        region.type,
        region.codes,
        latestQuarter,
      ),
      this.repository.getStoreCategoryBreakdown(
        region.type,
        region.codes,
        latestQuarter,
      ),
      this.repository.getSalesTrend(region.type, region.codes, quarters),
    ]);

    return AnalysisMapper.toAnalysisResponse(
      salesAgg,
      storeAgg,
      popAgg,
      workingPopAgg,
      storeGroups,
      trendGroups,
      {
        regionCode,
        codes: region.codes,
        type: region.type,
        stdrYyquCd: latestQuarter,
        quartersToFetch: quarters,
      },
    );
  }

  async getRevenueAndCost(trdarCd: string, userId: string | undefined) {
    let preferredIndustry: string | undefined = undefined;
    let userPreferences: UserPreferences | null = null;

    if (userId) {
      const userInfo = await this.usersService.getOnboarding(userId);
      if (userInfo?.industryCode) {
        preferredIndustry = userInfo.industryCode;
      }
      userPreferences = userInfo as unknown as UserPreferences;
    }

    let appliedIndustryName = '전체 업종';
    if (preferredIndustry) {
      const name = await this.repository.getIndustryName(preferredIndustry);
      if (name) {
        appliedIndustryName = name;
      }
    }

    const quarters = await this.repository.getAvailableQuarters('COMMERCIAL', [
      trdarCd,
    ]);

    const latestQuarter =
      quarters.length > 0 ? quarters[quarters.length - 1] : '20253';

    const salesData = await this.repository.getSalesByIndustry(
      latestQuarter,
      trdarCd,
      preferredIndustry, // Use user's preferred industry
    );

    let estimatedRevenue = 0;
    const appliedIndustry =
      userId && preferredIndustry ? preferredIndustry : 'all';

    if (salesData.length > 0) {
      const totalRevenue = Number(salesData[0].total_revenue);
      const storeCount = Number(salesData[0].store_count);
      if (storeCount > 0) {
        estimatedRevenue = Math.floor(totalRevenue / storeCount / 3);
      }
    }

    // 창업 비용 (임대료 등) 조회
    const rentData = await this.repository.getRentData(trdarCd);

    // 보증금 (없으면 DB 평균값 or 기본값 5,000만)
    const deposit = rentData?.avg_deposit
      ? Math.floor(rentData.avg_deposit)
      : 50000000;

    // 월세 (단위: 천원 -> 원)
    const monthlyRent = rentData?.avg_monthly_rent
      ? Math.floor(rentData.avg_monthly_rent * 1000)
      : 0;

    // 권리금 (없으면 0)
    const premium = rentData?.avg_premium
      ? Math.floor(rentData.avg_premium)
      : 0;

    // 인테리어 비용
    const interiorCost = INTERIOR_COST_PER_PY * AVG_STORE_SIZE;

    // 총 창업 비용
    const totalStartupCost = deposit + premium + interiorCost;

    // 경쟁 업체 수
    const competitorCount = await this.repository.getStoreCount(
      latestQuarter,
      trdarCd,
      preferredIndustry,
    );

    let matchingScore = 0;
    if (userPreferences?.completed) {
      try {
        const benchmarks = await this.repository.getScoringBenchmarks(
          latestQuarter,
          preferredIndustry,
        );
        const regionScoreData = await this.repository.getRegionScoreData(
          latestQuarter,
          trdarCd,
        );
        const salesAgg = await this.repository.aggregateSales(
          'COMMERCIAL',
          [trdarCd],
          latestQuarter,
        );

        const formattedSalesData: ScoringSalesInput = {
          thsmon_selng_amt: Number(salesAgg._sum.thsmon_selng_amt || 0),
          agrde_10_selng_amt: Number(salesAgg._sum.agrde_10_selng_amt || 0),
          agrde_20_selng_amt: Number(salesAgg._sum.agrde_20_selng_amt || 0),
          agrde_30_selng_amt: Number(salesAgg._sum.agrde_30_selng_amt || 0),
          agrde_40_selng_amt: Number(salesAgg._sum.agrde_40_selng_amt || 0),
          agrde_50_selng_amt: Number(salesAgg._sum.agrde_50_selng_amt || 0),
          agrde_60_above_selng_amt: Number(
            salesAgg._sum.agrde_60_above_selng_amt || 0,
          ),
          tmzon_00_06_selng_amt: Number(
            salesAgg._sum.tmzon_00_06_selng_amt || 0,
          ),
          tmzon_06_11_selng_amt: Number(
            salesAgg._sum.tmzon_06_11_selng_amt || 0,
          ),
          tmzon_11_14_selng_amt: Number(
            salesAgg._sum.tmzon_11_14_selng_amt || 0,
          ),
          tmzon_14_17_selng_amt: Number(
            salesAgg._sum.tmzon_14_17_selng_amt || 0,
          ),
          tmzon_17_21_selng_amt: Number(
            salesAgg._sum.tmzon_17_21_selng_amt || 0,
          ),
          tmzon_21_24_selng_amt: Number(
            salesAgg._sum.tmzon_21_24_selng_amt || 0,
          ),
        };

        const formattedRegionData: RegionData = {
          trdar_cd: trdarCd,
          tot_flpop_co: Number(regionScoreData.tot_flpop_co || 0),
          agrde_20_flpop_co: Number(regionScoreData.agrde_20_flpop_co || 0),
          tot_repop_co: regionScoreData.tot_repop_co || 0,
          tot_wrc_popltn_co: regionScoreData.tot_wrc_popltn_co || 0,
          apt_hshld_co: regionScoreData.apt_hshld_co || 0,
          univ_co: regionScoreData.univ_co || 0,
          subway_statn_co: regionScoreData.subway_statn_co || 0,
          viatr_fclty_co: regionScoreData.viatr_fclty_co || 0,
          stayng_fclty_co: regionScoreData.stayng_fclty_co || 0,
        };

        const formattedRentData = {
          avg_deposit: rentData?.avg_deposit ?? 0,
          avg_rent: rentData?.avg_monthly_rent ?? 0,
        };

        const myTotalSales = Number(salesData[0]?.total_revenue || 0);
        const areaSize = await this.repository.getAreaSize(trdarCd);
        const myDensity = competitorCount / (areaSize || 1);
        const industryData = {
          sales: myTotalSales,
          density: myDensity,
        };

        matchingScore =
          this.locationRecommendService.calculateRecommendationScore(
            formattedSalesData,
            formattedRegionData,
            formattedRentData,
            {
              maxFootTraffic: benchmarks.maxFootTraffic,
              avgIndustrySales: benchmarks.avgIndustrySales,
              avgDensity: benchmarks.avgDensity,
            },
            userPreferences,
            industryData,
          );
      } catch (e) {
        console.error('Scoring error detailed:', e);
        if (e instanceof Error) {
          console.error('Stack:', e.stack);
        }
        matchingScore = 0;
      }
    } else {
      console.log(
        'User preferences not completed or missing:',
        userPreferences,
      );
    }
    console.log('Final Matching Score:', matchingScore);

    return {
      estimatedRevenue,
      startupCost: {
        total: totalStartupCost,
        deposit,
        monthlyRent,
        marketing: 0,
        interior: interiorCost,
        etc: 0,
      },
      competitorCount,
      avgMonthlyRent: monthlyRent,
      matchingScore,
      appliedIndustry,
      appliedIndustryName,
    };
  }

  async searchRegions(query: string): Promise<RegionSearchResult[]> {
    if (!query) return [];

    const trimmed = query.trim();
    const results: RegionSearchResult[] = [];

    const allGus = await this.repository.getAllGus();
    const guMap = new Map<string, string>();
    allGus.forEach((g) => guMap.set(g.signgu_cd, g.signgu_nm));

    if (this.isGuQuery(trimmed)) {
      return this.searchGu(trimmed, results);
    }

    if (trimmed.endsWith('동')) {
      return this.searchDong(trimmed, guMap);
    }

    return this.searchAll(trimmed, guMap);
  }

  async searchIndustries(query: string): Promise<IndustrySearchResult[]> {
    if (!query) return [];
    const results = await this.repository.searchIndustry(query);
    return results.map((r) => ({
      code: r.svc_induty_cd,
      name: r.svc_induty_cd_nm,
    }));
  }

  private async resolveRegion(
    regionCode: string,
  ): Promise<ResolvedRegion | null> {
    if (this.isNumericCode(regionCode)) {
      return this.resolveByCode(regionCode);
    }
    return this.resolveByName(regionCode);
  }

  private async resolveByCode(code: string): Promise<ResolvedRegion | null> {
    const gu = await this.repository.findGuByCode(code);
    if (gu) {
      return { type: 'GU', codes: [code] };
    }

    const dong = await this.repository.findDongByCode(code);
    if (dong) {
      return { type: 'DONG', codes: [code] };
    }

    const commercial = await this.repository.findCommercialByCode(code);
    if (commercial) {
      return { type: 'COMMERCIAL', codes: [code] };
    }

    return null;
  }

  private async resolveByName(name: string): Promise<ResolvedRegion | null> {
    const keywords = name.trim().split(/\s+/);

    if (keywords.length >= 2) {
      const lastTwo = keywords.slice(-2).join(' ');
      const result = await this.searchInTables(lastTwo);
      if (result) return result;
    }

    const lastOne = keywords[keywords.length - 1];
    const result = await this.searchInTables(lastOne);
    if (result) return result;

    if (keywords.length > 2) {
      return this.searchInTables(name.trim());
    }

    return null;
  }

  private async searchInTables(term: string): Promise<ResolvedRegion | null> {
    const endsWithGu = term.endsWith('구');
    const endsWithDong = term.endsWith('동');
    let processTerm = term;

    if (endsWithDong && processTerm.length >= 2) {
      processTerm = processTerm.slice(0, -1);
    }

    if (endsWithGu) {
      return this.findGuOrCommercial(term);
    }

    if (endsWithDong) {
      return this.findDong(processTerm);
    }

    return this.findAnyType(term);
  }

  private async findGuOrCommercial(
    term: string,
  ): Promise<ResolvedRegion | null> {
    let guList = await this.repository.findGuByName(term, true);
    if (guList.length === 0) {
      guList = await this.repository.findGuByName(term, false);
    }
    if (guList.length > 0) {
      return { type: 'GU', codes: [guList[0].signgu_cd] };
    }

    const commList = await this.repository.findCommercialByName(term, false);
    if (commList.length > 0) {
      return { type: 'COMMERCIAL', codes: [commList[0].trdar_cd] };
    }

    return null;
  }

  private async findDong(term: string): Promise<ResolvedRegion | null> {
    let dongList = await this.repository.findDongByName(term, true);
    if (dongList.length === 0) {
      dongList = await this.repository.findDongByName(term, false);
    }
    if (dongList.length > 0) {
      return { type: 'DONG', codes: [dongList[0].adstrd_cd] };
    }
    return null;
  }

  private async findAnyType(term: string): Promise<ResolvedRegion | null> {
    let guList = await this.repository.findGuByName(term, true);
    if (guList.length === 0) {
      guList = await this.repository.findGuByName(term, false);
    }
    if (guList.length > 0) {
      return { type: 'GU', codes: [guList[0].signgu_cd] };
    }

    let dongList = await this.repository.findDongByName(term, true);
    if (dongList.length === 0) {
      dongList = await this.repository.findDongByName(term, false);
    }
    if (dongList.length > 0) {
      return { type: 'DONG', codes: [dongList[0].adstrd_cd] };
    }

    let commList = await this.repository.findCommercialByName(term, true);
    if (commList.length === 0) {
      commList = await this.repository.findCommercialByName(term, false);
    }
    if (commList.length > 0) {
      return { type: 'COMMERCIAL', codes: [commList[0].trdar_cd] };
    }

    return null;
  }

  private isNumericCode(code: string): boolean {
    return !isNaN(Number(code));
  }

  private isGuQuery(query: string): boolean {
    return query.endsWith('구') && query.length >= 3 && query.length <= 4;
  }

  private async searchGu(
    trimmed: string,
    results: RegionSearchResult[],
  ): Promise<RegionSearchResult[]> {
    const commMatches = await this.repository.findCommercialByName(
      trimmed,
      false,
    );
    commMatches.forEach((c) => {
      results.push({
        type: 'COMMERCIAL',
        code: c.trdar_cd,
        name: c.trdar_cd_nm,
        fullName: `${c.signgu_cd_nm || ''} ${c.trdar_cd_nm}`.trim(),
      });
    });

    return results;
  }

  private async searchDong(
    trimmed: string,
    guMap: Map<string, string>,
  ): Promise<RegionSearchResult[]> {
    const dongMatches = await this.repository.findDongByName(trimmed, false);
    return dongMatches.map((d) => {
      const guCode = d.adstrd_cd.slice(0, 5);
      const guName = guMap.get(guCode) || '';
      const cityName = this.getCityName(d.adstrd_cd);
      return {
        type: 'DONG',
        code: d.adstrd_cd,
        name: d.adstrd_nm,
        fullName: `${cityName} ${guName} ${d.adstrd_nm}`.trim(),
      };
    });
  }

  private async searchAll(
    trimmed: string,
    guMap: Map<string, string>,
  ): Promise<RegionSearchResult[]> {
    const results: RegionSearchResult[] = [];
    const keywords = trimmed.split(/\s+/);
    const lastKeyword = keywords[keywords.length - 1];

    const dongMatches = await this.repository.findDongByName(trimmed, false);
    const dongByLast = await this.repository.findDongByName(lastKeyword, false);

    const dongSet = new Set<string>();
    [...dongMatches, ...dongByLast].forEach((d) => {
      if (dongSet.has(d.adstrd_cd)) return;
      dongSet.add(d.adstrd_cd);

      const guCode = d.adstrd_cd.slice(0, 5);
      const guName = guMap.get(guCode) || '';
      const cityName = this.getCityName(d.adstrd_cd);
      results.push({
        type: 'DONG',
        code: d.adstrd_cd,
        name: d.adstrd_nm,
        fullName: `${cityName} ${guName} ${d.adstrd_nm}`.trim(),
      });
    });

    const commMatches = await this.repository.findCommercialByName(
      trimmed,
      false,
    );
    const commByLast = await this.repository.findCommercialByName(
      lastKeyword,
      false,
    );

    const allComm = [...commMatches, ...commByLast];
    allComm.sort((a, b) => {
      const aFull = a.trdar_cd_nm.includes(trimmed);
      const bFull = b.trdar_cd_nm.includes(trimmed);
      if (aFull && !bFull) return -1;
      if (!aFull && bFull) return 1;
      return 0;
    });

    const commSet = new Set<string>();
    allComm.forEach((c) => {
      if (commSet.has(c.trdar_cd)) return;
      commSet.add(c.trdar_cd);
      results.push({
        type: 'COMMERCIAL',
        code: c.trdar_cd,
        name: c.trdar_cd_nm,
        fullName: `${c.signgu_cd_nm || ''} ${c.trdar_cd_nm}`.trim(),
      });
    });

    return results;
  }

  private getCityName(code: string): string {
    const cityCode = code.substring(0, 2);
    if (cityCode === '11') return '서울특별시';
    return '';
  }
}
