import React, { useState } from 'react';
import { InfoBarData } from '../../types/map-types';
import RevenueCard from './RevenueCard';
import MarketBadge from './market/MarketBadge';
import ReviewSummary from './market/ReviewSummary';
import StoreList from './market/StoreList';
import VitalityStats from './market/VitalityStats';
import DetailedStores from './market/DetailedStores';
import SalesAnalysisSection from './market/SalesAnalysisSection';
import { useMarketAnalysis } from '@/hooks/useMarketAnalysis';

interface DetailContentsProps {
  data: InfoBarData;
}

export default function DetailContents({ data }: DetailContentsProps) {
  const { analysisData, loading } = useMarketAnalysis(data);
  const [view, setView] = useState<'summary' | 'list'>('summary');

  if (view === 'list' && analysisData) {
    return (
      <DetailedStores
        stores={analysisData.stores}
        onBack={() => setView('summary')}
      />
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!analysisData) {
    return <EmptyState />;
  }

  const hasSalesData = analysisData.sales != null;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <>
        <MarketBadge
          isCommercialZone={analysisData.isCommercialZone}
          areaName={analysisData.areaName}
          commercialCode={
            data.commercialCode ||
            (data.adm_cd ? String(data.adm_cd) : undefined)
          }
          commercialName={
            data.commercialName || data.adm_nm || analysisData.areaName
          }
        />
        <RevenueCard
          title={
            analysisData.isCommercialZone
              ? '월평균 추정 매출'
              : '지역 평균 매출'
          }
          amount={`약 ${(analysisData.estimatedRevenue / 100000000).toFixed(1)}억 원`}
          description={analysisData.salesDescription}
          highlight={analysisData.isCommercialZone}
        />
        <StoreList
          stores={analysisData.stores}
          onShowMore={() => setView('list')}
        />
        {hasSalesData && (
          <SalesAnalysisSection salesData={analysisData.sales} />
        )}

        <ReviewSummary reviewSummary={analysisData.reviewSummary} />
        <VitalityStats
          openingRate={analysisData.openingRate}
          closureRate={analysisData.closureRate}
        />
      </>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-40 space-y-3">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm">상권 분석 중...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center text-gray-500 py-10">
      데이터를 불러올 수 없습니다.
    </div>
  );
}
