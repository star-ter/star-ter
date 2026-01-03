import React from 'react';
import { CustomerCompositionData, ZoneOverviewData } from '@/types/report.types';

interface ZoneOverviewProps {
  data: ZoneOverviewData;
}

export const ZoneOverview = ({ data }: ZoneOverviewProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-4 h-full bg-white">
      <h3 className="text-sm font-bold text-gray-800 mb-2.5">2) 상권 개요</h3>
      <div className="space-y-2 text-xs">
        <div className="flex">
          <span className="w-20 text-gray-500 shrink-0">권역 특성</span>
          <span className="font-medium text-gray-900 line-clamp-1">{data.characteristics}</span>
        </div>
        <div className="flex">
          <span className="w-20 text-gray-500 shrink-0">방문 동기</span>
          <span className="font-medium text-gray-900 line-clamp-1">{data.visitMotivation}</span>
        </div>
         <div className="flex">
          <span className="w-20 text-gray-500 shrink-0">피크 시간</span>
          <span className="font-medium text-gray-900">{data.peakTime}</span>
        </div>
         <div className="flex">
          <span className="w-20 text-gray-500 shrink-0">유입 경로</span>
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
    <div className="w-full border border-gray-200 rounded-xl p-4 h-full bg-white">
      <h3 className="text-sm font-bold text-gray-800 mb-2.5">3) 고객 구성(성별)</h3>
      
      {data.malePercentage === 0 && data.femalePercentage === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs h-24">
          데이터 부족
        </div>
      ) : (
        <>
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
              <span>남/여 비중</span>
            </div>
            <div className="w-full h-2.5 bg-pink-100/50 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${data.malePercentage}%` }}
              />
              <div className="flex-1 h-full bg-pink-500" />
            </div>
          </div>

          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between w-full">
              <span>남성</span>
              <span className="font-bold text-gray-900">{data.malePercentage}%</span>
            </div>
            <div className="flex justify-between w-full">
              <span>여성</span>
               <span className="font-bold text-gray-900">{data.femalePercentage}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
