import { Injectable, Logger } from '@nestjs/common';
import {
  GetMarketAnalysisQueryDto,
  MarketStoreListDto,
  MarketStore,
  GetBuildingStoreQueryDto,
  BuildingStoreCountDto,
} from './dto/market-store.dto';

import { MarketAnalyticsDto } from './dto/market-analytics.dto';

import { MarketRepository } from './market.repository';
import { MarketMapper } from './market.mapper';
import { BuildingStore } from 'generated/prisma/client';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(private readonly marketRepository: MarketRepository) {}

  // ===============================
  // PUBLIC API 메서드
  // ===============================

  async getStoreList(
    query: GetMarketAnalysisQueryDto,
  ): Promise<MarketStoreListDto> {
    const lat = parseFloat(query.latitude);
    const lng = parseFloat(query.longitude);
    const polygon = query.polygon;

    this.logger.log(`[프론트으로부터 상권 분석 요청] Lat: ${lat}, Lng: ${lng}`);

    let stores: MarketStore[] = [];
    if (polygon) {
      this.logger.log(`[폴리곤 WKT도 같이 받음] 길이: ${polygon.length}`);
      try {
        const externalStoreData =
          await this.marketRepository.findStoresInPolygon(polygon);
        const items = externalStoreData;

        if (items && items.length > 0) {
          stores = this.mapToMarketStores(items);
          this.logger.log(`[데이터 매핑 완료] ${stores.length}개 업소`);
        } else {
          this.logger.warn('[외부 데이터] items가 없습니다.');
        }
      } catch (error) {
        this.logger.error('Fetch 실패 외부 API', error);
      }
    } else {
      this.logger.log('No polygon');
    }

    if (stores.length === 0) {
      this.logger.log('분석된 상가 데이터가 없습니다.');
    }

    return {
      areaName: '선택된 지역',
      reviewSummary: { naver: '여기 끝내줘요!!!' },
      stores: stores,
    };
  }

  /**
   * 마커/폴리곤 클릭 시 Analytics 데이터 조회
   *
   * level 파라미터에 따라 적절한 레벨의 데이터를 반환:
   * - 'gu': 행정구 매출 데이터 (줌 레벨 7 이상)
   * - 'dong' 또는 미지정: 상권 → 행정동 순서로 조회 (기존 로직)
   */
  async getAnalytics(
    query: GetMarketAnalysisQueryDto,
  ): Promise<MarketAnalyticsDto> {
    const { latitude, longitude, level, signgu_cd, adstrd_cd } = query;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    this.logger.log(
      `[Analytics 요청] lat: ${lat}, lng: ${lng}, level: ${level || 'default'}, signgu_cd: ${signgu_cd || 'none'}, adstrd_cd: ${adstrd_cd || 'none'}`,
    );

    // (1) level이 'gu'인 경우: 행정구 데이터 조회
    if (level === 'gu') {
      if (signgu_cd) {
        return this.fetchGuAnalytics(signgu_cd);
      }
      const guArea = await this.marketRepository.findAdministrativeGu(lat, lng);
      if (guArea) {
        return this.fetchGuAnalytics(guArea.signgu_cd);
      }
      return MarketMapper.getEmptySalesData('행정구 정보를 찾을 수 없습니다.');
    }

    // (2) level이 'dong'인 경우: 행정동 데이터 직접 조회
    if (level === 'dong') {
      if (adstrd_cd) {
        return this.fetchDongAnalytics(adstrd_cd);
      }
      const adminArea = await this.marketRepository.findAdministrativeDistrict(
        lat,
        lng,
      );
      if (adminArea) {
        return this.fetchDongAnalytics(adminArea.adstrd_cd);
      }
      return MarketMapper.getEmptySalesData('행정동 정보를 찾을 수 없습니다.');
    }

    // (3) 기본 동작: 상권 → 행정동 순서로 조회
    const commercialArea = await this.marketRepository.findCommercialArea(
      lat,
      lng,
    );
    if (commercialArea) {
      return this.fetchCommercialAnalytics(
        commercialArea.trdar_cd,
        commercialArea.trdar_cd_nm,
      );
    }

    const adminArea = await this.marketRepository.findAdministrativeDistrict(
      lat,
      lng,
    );
    if (adminArea) {
      return this.fetchDongAnalytics(adminArea.adstrd_cd);
    }

    return MarketMapper.getEmptySalesData('분석할 수 없는 지역입니다.');
  }

  async getBuildingStoreCounts(
    query: GetBuildingStoreQueryDto,
  ): Promise<BuildingStoreCountDto[]> {
    const storesData = await this.marketRepository.findStoresInRectangle({
      minLng: query.minx,
      minLat: query.miny,
      maxLng: query.maxx,
      maxLat: query.maxy,
      categorie: query.categories || null,
    });

    const result: BuildingStoreCountDto[] = [];

    const grouped = new Map<string, BuildingStore[]>();

    storesData.forEach((item) => {
      if (!item.building_management_no) return;

      if (!grouped.has(item.building_management_no)) {
        grouped.set(item.building_management_no, []);
      }

      grouped.get(item.building_management_no)!.push(item);
    });

    for (const [key, storeItems] of grouped) {
      const representative = storeItems[0];
      if (representative.latitude && representative.longitude) {
        result.push({
          buildingId: key,
          lat: Number(representative.latitude),
          lng: Number(representative.longitude),
          count: storeItems.length,
          name: representative.building_name || '상가건물',
        });
      }
    }

    return result;
  }

  // ===============================
  // PRIVATE - Analytics 조회
  // ===============================

  private async fetchGuAnalytics(code: string): Promise<MarketAnalyticsDto> {
    const [salesData, storeStats, topIndustries] = await Promise.all([
      this.marketRepository.getAdminGuRevenueTrend(code),
      this.marketRepository.getGuStoreStats(code),
      this.marketRepository.getGuTopIndustries(code),
    ]);

    const { openingRate, closureRate } = this.calculateRates(storeStats);
    const guArea = await this.marketRepository.findGuByCode(code);
    const areaName = guArea?.signgu_nm || code;

    return MarketMapper.mapToAnalyticsDto(
      salesData,
      areaName,
      false,
      openingRate,
      closureRate,
      topIndustries,
    );
  }

  private async fetchDongAnalytics(code: string): Promise<MarketAnalyticsDto> {
    const [salesData, storeStats, topIndustries] = await Promise.all([
      this.marketRepository.getAdminDongRevenueTrend(code),
      this.marketRepository.getAdministrativeStoreStats(code),
      this.marketRepository.getDongTopIndustries(code),
    ]);

    const { openingRate, closureRate } = this.calculateRates(storeStats);
    const dongArea = await this.marketRepository.findDongByCode(code);
    const areaName = dongArea?.adstrd_nm || code;

    return MarketMapper.mapToAnalyticsDto(
      salesData,
      areaName,
      false,
      openingRate,
      closureRate,
      topIndustries,
    );
  }

  private async fetchCommercialAnalytics(
    code: string,
    name: string,
  ): Promise<MarketAnalyticsDto> {
    const [salesData, storeStats, topIndustries] = await Promise.all([
      this.marketRepository.getCommercialRevenueTrend(code),
      this.marketRepository.getCommercialStoreStats(code),
      this.marketRepository.getCommercialTopIndustries(code),
    ]);

    const { openingRate, closureRate } = this.calculateRates(storeStats);

    return MarketMapper.mapToAnalyticsDto(
      salesData,
      name,
      true,
      openingRate,
      closureRate,
      topIndustries,
    );
  }

  private calculateRates(storeStats: {
    _sum: {
      stor_co: number | null;
      opbiz_stor_co: number | null;
      clsbiz_stor_co: number | null;
    };
  }) {
    const totalStores = storeStats._sum.stor_co || 0;
    const openingRate =
      totalStores > 0
        ? ((storeStats._sum.opbiz_stor_co || 0) / totalStores) * 100
        : 0;
    const closureRate =
      totalStores > 0
        ? ((storeStats._sum.clsbiz_stor_co || 0) / totalStores) * 100
        : 0;
    return { totalStores, openingRate, closureRate };
  }

  // ===============================
  // PRIVATE - 데이터 변환/유틸
  // ===============================

  private mapToMarketStores(items: BuildingStore[]): MarketStore[] {
    return items.map((item) => ({
      name: item.store_name,
      category: item.business_category_large_name,
      subcategory: item.ksic_name,
    }));
  }
}
