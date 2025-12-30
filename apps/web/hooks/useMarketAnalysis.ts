import { InfoBarData } from '@/types/map-types';
import { MarketAnalysisData } from '@/types/market-types';
import { convertToWKT } from '@/utils/map-utils';
import { useEffect, useState } from 'react';

export const useMarketAnalysis = (data: InfoBarData) => {
  const [analysisData, setAnalysisData] = useState<MarketAnalysisData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!data.x || !data.y) {
      console.warn('클릭한 좌표 데이터가 없습니다.');
      setLoading(false);
      return;
    }
    const fetchMarketAnalysis = async () => {
      setLoading(true);
      setAnalysisData(null);

      // 기본 쿼리 파라미터 (좌표 + level)
      const baseParams = new URLSearchParams({
        latitude: data.y.toString(),
        longitude: data.x.toString(),
      });

      // level 정보가 있으면 추가
      if (data.level) {
        baseParams.set('level', data.level);
        console.log(`[useMarketAnalysis] 클릭 레벨: ${data.level}`);
      }

      try {
        // ===============================================
        // 구/동 레벨: stores API 스킵 (폴리곤이 너무 커서 URL 길이 초과)
        // 상권/건물 레벨: stores API 호출
        // ===============================================
        const isLargeArea = data.level === 'gu' || data.level === 'dong';

        let storeData = { stores: [], reviewSummary: { naver: '' } };

        if (!isLargeArea && data.polygons) {
          // 상권/건물 레벨: 폴리곤으로 상점 조회
          const polygonWkt = convertToWKT(data.polygons);
          const storeParams = new URLSearchParams(baseParams);
          storeParams.set('polygon', polygonWkt);

          const storeRes = await fetch(
            `${API_BASE_URL}/market/stores?${storeParams.toString()}`,
          );
          if (storeRes.ok) {
            storeData = await storeRes.json();
          }
        }

        // Analytics API는 항상 호출 (좌표 + level만 사용)
        const analyticsRes = await fetch(
          `${API_BASE_URL}/market/analytics?${baseParams.toString()}`,
        );

        if (!analyticsRes.ok) {
          throw new Error('Analytics API 응답 에러');
        }

        const analyticsData = await analyticsRes.json();

        const mergedData: MarketAnalysisData = {
          // StoreListDto (상점 목록) - 구/동 레벨에서는 빈 배열
          areaName: analyticsData.areaName,
          reviewSummary: storeData.reviewSummary,
          stores: storeData.stores,
          // AnalyticsDto (매출 분석)
          isCommercialZone: analyticsData.isCommercialArea,
          estimatedRevenue: analyticsData.totalRevenue,
          salesDescription: '분기 매출 평균입니다.',

          openingRate: analyticsData.vitality?.openingRate || 0,
          closureRate: analyticsData.vitality?.closureRate || 0,

          sales: analyticsData.sales, // 상세 매출 정보 (차트용)
        };

        setAnalysisData(mergedData);
      } catch (error) {
        console.error('분석 데이터를 가져오는데 실패함.', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketAnalysis();
  }, [data, API_BASE_URL]);

  return {
    analysisData,
    loading,
  };
};
