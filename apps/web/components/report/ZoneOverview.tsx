import React from 'react';
import { CustomerCompositionData, ZoneOverviewData } from '@/types/report.types';

interface ZoneOverviewProps {
  data: ZoneOverviewData;
}

export const ZoneOverview = ({ data }: ZoneOverviewProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-5 h-full">
      <h3 className="text-sm font-bold text-gray-800 mb-4">2) 상권 개요</h3>
      <div className="space-y-3 text-sm">
        <div className="flex">
          <span className="w-24 text-gray-500 flex-shrink-0">권역 특성</span>
          <span className="font-medium text-gray-900">{data.characteristics}</span>
        </div>
        <div className="flex">
          <span className="w-24 text-gray-500 flex-shrink-0">방문 동기</span>
          <span className="font-medium text-gray-900">{data.visitMotivation}</span>
        </div>
         <div className="flex">
          <span className="w-24 text-gray-500 flex-shrink-0">피크 시간</span>
          <span className="font-medium text-gray-900">{data.peakTime}</span>
        </div>
         <div className="flex">
          <span className="w-24 text-gray-500 flex-shrink-0">유입 경로</span>
          <span className="font-medium text-gray-900">{data.inflowPath}</span>
        </div>
      </div>
    </div>
  );
};

interface CustomerCompositionProps {
  data: CustomerCompositionData;
}

export const CustomerComposition = ({ data }: CustomerCompositionProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-5 h-full">
      <h3 className="text-sm font-bold text-gray-800 mb-4">3) 고객 구성(성별)</h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>남/여 비중</span>
        </div>
        <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-blue-600" 
            style={{ width: `${data.malePercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex justify-between w-32">
          <span>남성</span>
          <span className="font-bold text-gray-900">{data.malePercentage}%</span>
        </div>
        <div className="flex justify-between w-32">
          <span>여성</span>
           <span className="font-bold text-gray-900">{data.femalePercentage}%</span>
        </div>
      </div>
    </div>
  );
};
