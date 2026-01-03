import { Injectable } from '@nestjs/common';
import { AnalysisRepository } from './analysis.repository';
import { AnalysisMapper } from './analysis.mapper';
import {
  AnalysisResponse,
  AnalysisError,
  ResolvedRegion,
  RegionSearchResult,
  IndustrySearchResult,
} from './dto/analysis.types';

@Injectable()
export class AnalysisService {
  constructor(private readonly repository: AnalysisRepository) {}

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
    const [salesAgg, storeAgg, popAgg, storeGroups, trendGroups] =
      await Promise.all([
        this.repository.aggregateSales(
          region.type,
          region.codes,
          latestQuarter,
        ),
        this.repository.aggregateStores(
          region.type,
          region.codes,
          latestQuarter,
        ),
        this.repository.aggregatePopulation(
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
