import React from 'react';
import { MarketSalesDetail } from '@/types/market-types';

// 그래프 컴포넌트들 (경로: market -> sidebar -> components -> comparison)
import SalesTrendGraph from '../../comparison/SalesTrendGraph';
import TimeOfDaySalesGraph from '../../comparison/TimeOfDaySalesGraph';
import WeeklySalesGraph from '../../comparison/WeeklySalesGraph';
import IndustrySalesGraph from '../../comparison/IndustrySalesGraph';
import AgeGenderSalesGraph from '../../comparison/AgeGenderSalesGraph';

// 데이터 변환 유틸리티
import {
  convertTrendData,
  convertTimeSlotData,
  convertDayOfWeekData,
  convertAgeData,
  convertGenderData,
} from '@/utils/salesDataConverter';

interface SalesAnalysisSectionProps {
  salesData: MarketSalesDetail;
}

export default function SalesAnalysisSection({
  salesData,
}: SalesAnalysisSectionProps) {
  return (
    <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
      <h3 className="text-sm font-bold text-gray-800 mb-4">📊 매출 상세 분석</h3>

      {/* 1. 분기별 매출 추이 그래프 */}
      <SalesTrendGraph data={convertTrendData(salesData.trend)} color="#4A90E2" />

      {/* 2. 시간대별 매출 그래프 */}
      <TimeOfDaySalesGraph data={convertTimeSlotData(salesData.timeSlot)} />

      {/* 3. 요일별 매출 그래프 */}
      <WeeklySalesGraph data={convertDayOfWeekData(salesData.dayOfWeek)} />

      {/* 4. 업종별 매출 Top 5 그래프 */}
      <IndustrySalesGraph data={salesData.topIndustries} />

      {/* 5. 성별/연령대별 매출 그래프 */}
      <AgeGenderSalesGraph
        ageData={convertAgeData(salesData.demographics)}
        genderData={convertGenderData(salesData.demographics)}
      />
    </div>
  );
}
