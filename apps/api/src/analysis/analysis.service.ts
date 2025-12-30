import { Injectable } from '@nestjs/common';
import { AnalysisRepository } from './analysis.repository';
import { AnalysisMapper } from './analysis.mapper';
import {
  AnalysisResponse,
  AnalysisError,
  ResolvedRegion,
  RegionSearchResult,
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
    allGus.forEach((g) => guMap.set(g.SIGNGU_CD, g.SIGNGU_NM));

    if (this.isGuQuery(trimmed)) {
      return this.searchGu(trimmed, results);
    }

    if (trimmed.endsWith('동')) {
      return this.searchDong(trimmed, guMap);
    }

    return this.searchAll(trimmed, guMap);
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
      return { type: 'GU', codes: [guList[0].SIGNGU_CD] };
    }

    const commList = await this.repository.findCommercialByName(term, false);
    if (commList.length > 0) {
      return { type: 'COMMERCIAL', codes: [commList[0].TRDAR_CD] };
    }

    return null;
  }

  private async findDong(term: string): Promise<ResolvedRegion | null> {
    let dongList = await this.repository.findDongByName(term, true);
    if (dongList.length === 0) {
      dongList = await this.repository.findDongByName(term, false);
    }
    if (dongList.length > 0) {
      return { type: 'DONG', codes: [dongList[0].ADSTRD_CD] };
    }
    return null;
  }

  private async findAnyType(term: string): Promise<ResolvedRegion | null> {
    let guList = await this.repository.findGuByName(term, true);
    if (guList.length === 0) {
      guList = await this.repository.findGuByName(term, false);
    }
    if (guList.length > 0) {
      return { type: 'GU', codes: [guList[0].SIGNGU_CD] };
    }

    let dongList = await this.repository.findDongByName(term, true);
    if (dongList.length === 0) {
      dongList = await this.repository.findDongByName(term, false);
    }
    if (dongList.length > 0) {
      return { type: 'DONG', codes: [dongList[0].ADSTRD_CD] };
    }

    let commList = await this.repository.findCommercialByName(term, true);
    if (commList.length === 0) {
      commList = await this.repository.findCommercialByName(term, false);
    }
    if (commList.length > 0) {
      return { type: 'COMMERCIAL', codes: [commList[0].TRDAR_CD] };
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
    const guMatches = await this.repository.findGuByName(trimmed, false);
    guMatches.forEach((g) => {
      const cityName = this.getCityName(g.SIGNGU_CD);
      results.push({
        type: 'GU',
        code: g.SIGNGU_CD,
        name: g.SIGNGU_NM,
        fullName: `${cityName} ${g.SIGNGU_NM}`.trim(),
      });
    });

    if (results.length === 0) {
      const commMatches = await this.repository.findCommercialByName(
        trimmed,
        false,
      );
      commMatches.forEach((c) => {
        results.push({
          type: 'COMMERCIAL',
          code: c.TRDAR_CD,
          name: c.TRDAR_CD_NM,
          fullName: `${c.SIGNGU_CD_NM || ''} ${c.TRDAR_CD_NM}`.trim(),
        });
      });
    }

    return results;
  }

  private async searchDong(
    trimmed: string,
    guMap: Map<string, string>,
  ): Promise<RegionSearchResult[]> {
    const dongMatches = await this.repository.findDongByName(trimmed, false);
    return dongMatches.map((d) => {
      const guCode = d.ADSTRD_CD.slice(0, 5);
      const guName = guMap.get(guCode) || '';
      const cityName = this.getCityName(d.ADSTRD_CD);
      return {
        type: 'DONG',
        code: d.ADSTRD_CD,
        name: d.ADSTRD_NM,
        fullName: `${cityName} ${guName} ${d.ADSTRD_NM}`.trim(),
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
      if (dongSet.has(d.ADSTRD_CD)) return;
      dongSet.add(d.ADSTRD_CD);

      const guCode = d.ADSTRD_CD.slice(0, 5);
      const guName = guMap.get(guCode) || '';
      const cityName = this.getCityName(d.ADSTRD_CD);
      results.push({
        type: 'DONG',
        code: d.ADSTRD_CD,
        name: d.ADSTRD_NM,
        fullName: `${cityName} ${guName} ${d.ADSTRD_NM}`.trim(),
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
      const aFull = a.TRDAR_CD_NM.includes(trimmed);
      const bFull = b.TRDAR_CD_NM.includes(trimmed);
      if (aFull && !bFull) return -1;
      if (!aFull && bFull) return 1;
      return 0;
    });

    const commSet = new Set<string>();
    allComm.forEach((c) => {
      if (commSet.has(c.TRDAR_CD)) return;
      commSet.add(c.TRDAR_CD);
      results.push({
        type: 'COMMERCIAL',
        code: c.TRDAR_CD,
        name: c.TRDAR_CD_NM,
        fullName: `${c.SIGNGU_CD_NM || ''} ${c.TRDAR_CD_NM}`.trim(),
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
