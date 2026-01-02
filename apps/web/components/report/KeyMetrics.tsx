import React from 'react';
import { KeyMetricsData } from '@/types/report.types';

interface KeyMetricsProps {
  data: KeyMetricsData;
}

const formatCurrency = (val: number) => {
  if (val >= 100000000) {
    const main = Math.floor(val / 100000000);
    const remainder = Math.floor((val % 100000000) / 10000);
    return remainder > 0 ? `${main}억 ${remainder}천만` : `${main}억`;
  }
  return `${Math.floor(val / 10000)}만`;
};

export const KeyMetrics = ({ data }: KeyMetricsProps) => {
  return (
    <div className="w-full">
      <h2 className="text-lg font-bold text-gray-800 mb-4">1) 한 눈에 보는 핵심 지표</h2>
      
      <div className="flex justify-between items-center mb-4 px-1">
         <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-500 font-medium">평균 월 매출</span>
            <span className="text-xl font-extrabold text-gray-900">
               약 {formatCurrency(data.estimatedMonthlySales.max)} 원
            </span>
         </div>
         <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-500 font-medium">상위 20% 월 매출</span>
             <span className="text-xl font-extrabold text-gray-900">
               약 {formatCurrency(data.wellDoingMonthlySales.max)} 원
            </span>
         </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-32 hover:shadow-sm transition-shadow">
          <div>
            <div className="text-xs text-gray-500 mb-1">월 추정 유동인구</div>
            <div className="text-lg font-bold text-gray-900">약 {data.floatingPopulation.count.toLocaleString()}명</div>
          </div>
           <div className="text-xs text-gray-500">
             <span className="block text-gray-400 text-[10px] mb-0.5">주요 유동 집중:</span>
             {data.floatingPopulation.mainTime}
           </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-32 hover:shadow-sm transition-shadow">
           <div>
            <div className="text-xs text-gray-500 mb-1">주요 방문 요일</div>
            <div className="text-lg font-bold text-gray-900">{data.mainVisitDays.days.join('·')}</div>
          </div>
           <div className="text-xs text-gray-500">
            {data.mainVisitDays.comment}
           </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-32 hover:shadow-sm transition-shadow">
           <div>
            <div className="text-xs text-gray-500 mb-1">핵심 고객층</div>
            <div className="text-lg font-bold text-gray-900">{data.coreCustomer.ageGroup}</div>
          </div>
           <div className="text-xs text-gray-400">
            {data.coreCustomer.comment}
           </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-32 hover:shadow-sm transition-shadow">
           <div>
            <div className="text-xs text-gray-500 mb-1">경쟁 강도(반경 500m)</div>
            <div className="text-lg font-bold text-gray-900">{data.competitionIntensity.level}</div>
          </div>
           <div className="text-xs text-gray-400 text-ellipsis overflow-hidden whitespace-nowrap" title={data.competitionIntensity.comment}>
            {data.competitionIntensity.comment}
           </div>
        </div>
      </div>
    </div>
  );
};
