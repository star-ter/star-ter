import React, { useEffect, useState } from 'react';
import { InfoBarData } from '../../types/map-types';
import RevenueCard from './RevenueCard';
import { MarketAnalysisData } from '@/types/market-types';
import MarketBadge from './market/MarketBadge';
import ReviewSummary from './market/ReviewSummary';
import StoreList from './market/StoreList';
import VitalityStats from './market/VitalityStats';

interface DetailContentsProps {
  data: InfoBarData;
}

export default function DetailContents({ data }: DetailContentsProps) {
  // 실제로는 API 등에서 건물의 기본 정보를 가져와야 함.
  // 현재는 임시값(약 2,975억 원)으로 유지.
  const [analysisData, setAnalysisData] = useState<MarketAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchMarketAnalysis = async () => {
      setLoading(true);
      setAnalysisData(null);
      try {
        console.log('Fetching analysis for:', data.y, data.x);
        const res = await fetch(
          `${API_BASE_URL}/market/analysis?latitude=${data.y}&longitude=${data.x}`
        );
        
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
    if (data.x && data.y) {
      fetchMarketAnalysis();
    }
  }, [data, API_BASE_URL]);

 return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* 1. 로딩 중 */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-40 space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">상권 분석 중...</p>
        </div>
      )}
      {/* 2. 데이터 없음 (에러) */}
      {!loading && !analysisData && (
        <div className="text-center text-gray-500 py-10">
          데이터를 불러올 수 없습니다.
        </div>
      )}
      {/* 3. 데이터 있음 (렌더링) */}
      {!loading && analysisData && (
        <>
          {/* 상권 뱃지 (Hot Place vs 일반) */}
          <MarketBadge
            isCommercialZone={analysisData.isCommercialZone}
            areaName={analysisData.areaName}
          />
          {/* 매출 카드 */}
          <RevenueCard
            title={analysisData.isCommercialZone ? "월평균 추정 매출" : "지역 평균 매출"}
            amount={`약 ${(analysisData.estimatedRevenue / 100000000).toFixed(1)}억 원`}
            description={analysisData.salesDescription}
            highlight={analysisData.isCommercialZone}
          />
          {/* 리뷰 요약 */}
          <ReviewSummary reviewSummary={analysisData.reviewSummary} />
          {/* 주요 매장 리스트 */}
          <StoreList stores={analysisData.stores} />
          {/* 상권 생명력 (개폐업률) */}
          <VitalityStats
            openingRate={analysisData.openingRate}
            closureRate={analysisData.closureRate}
          />
        </>
      )}
    </div>
  );
}
