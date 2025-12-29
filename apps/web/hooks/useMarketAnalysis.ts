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

      const polygonWkt = data.polygons ? convertToWKT(data.polygons) : '';

      const queryParams = new URLSearchParams({
        latitude: data.y.toString(),
        longitude: data.x.toString(),
        polygon: polygonWkt,
      });
      const queryString = queryParams.toString();

      try {
        const [storeRes, analyticsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/market/stores?${queryString}`),
          fetch(`${API_BASE_URL}/market/analytics?${queryString}`),
        ]);

        if (!storeRes.ok || !analyticsRes.ok) {
          throw new Error('API 응답 에러');
        }

        const storeData = await storeRes.json();
        const analyticsData = await analyticsRes.json();

        const mergedData: MarketAnalysisData = {
          // StoreListDto (상점 목록)
          areaName: analyticsData.areaName,
          reviewSummary: storeData.reviewSummary,
          stores: storeData.stores,
          // AnalyticsDto (매출 분석)
          isCommercialZone: analyticsData.isCommercialArea,
          estimatedRevenue: analyticsData.totalRevenue,
          salesDescription:
            analyticsData.sales?.peakTimeSummaryComment || '데이터 분석 중...',

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
