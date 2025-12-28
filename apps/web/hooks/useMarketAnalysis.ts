import { InfoBarData } from '@/types/map-types';
import { MarketAnalysisData } from '@/types/market-types';
import { createMarketAnalysisUrl } from '@/utils/map-utils';
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
      return;
    }
    const fetchMarketAnalysis = async () => {
      setLoading(true);
      setAnalysisData(null);

      const finalUrl = createMarketAnalysisUrl(
        API_BASE_URL!,
        data.y,
        data.x,
        data.polygons,
      );

      try {
        console.log('Fetching analysis for:', data.y, data.x);
        const res = await fetch(finalUrl);

        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const result: MarketAnalysisData = await res.json();
        setAnalysisData(result);
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
