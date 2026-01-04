import React from 'react';
import { KeyMetricsData } from '@/types/report.types';

interface KeyMetricsProps {
  data: KeyMetricsData;
}

const formatCurrency = (val: number) => {
  if (val <= 0) return '데이터 부족';
  if (val >= 100000000) {
    const main = Math.floor(val / 100000000);
    const remainder = Math.floor((val % 100000000) / 10000);
    return remainder > 0 ? `약 ${main}억 ${remainder}천만 원` : `약 ${main}억 원`;
  }
  return `약 ${Math.floor(val / 10000)}만 원`;
};

export const KeyMetrics = ({ data }: KeyMetricsProps) => {
  return (
    <div className="w-full">
      <h2 className="text-base font-bold text-gray-800 mb-3">1) 한 눈에 보는 핵심 지표</h2>
      
      <div className="flex justify-between items-center mb-3 px-1">
         <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500 font-medium">평균 월 매출</span>
            <span className={`text-lg font-extrabold ${data.estimatedMonthlySales.max <= 0 ? 'text-gray-400 text-sm' : 'text-gray-900'}`}>
               {formatCurrency(data.estimatedMonthlySales.max)}
            </span>
         </div>
         <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500 font-medium">상위 20% 월 매출</span>
             <span className={`text-lg font-extrabold ${data.wellDoingMonthlySales.max <= 0 ? 'text-gray-400 text-sm' : 'text-gray-900'}`}>
               {formatCurrency(data.wellDoingMonthlySales.max)}
            </span>
         </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="border border-gray-200 rounded-xl p-3.5 flex flex-col justify-between h-28 bg-white hover:shadow-sm transition-shadow">
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">월 추정 유동인구</div>
            <div className={`text-base font-bold ${data.floatingPopulation.count <= 0 ? 'text-gray-400 text-xs' : 'text-gray-900'}`}>
              {data.floatingPopulation.count <= 0 ? '데이터 부족' : `약 ${data.floatingPopulation.count.toLocaleString()}명`}
            </div>
          </div>
           <div className="text-[10px] text-gray-400">
             <span className="text-gray-400 text-[9px] mr-1">주요 유동 집중:</span>
             {data.floatingPopulation.count <= 0 ? '-' : data.floatingPopulation.mainTime}
           </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-3.5 flex flex-col justify-between h-28 bg-white hover:shadow-sm transition-shadow">
           <div>
            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">주요 방문 요일</div>
            <div className={`text-base font-bold ${data.estimatedMonthlySales.max <= 0 ? 'text-gray-400 text-xs' : 'text-gray-900'}`}>
              {data.estimatedMonthlySales.max <= 0 ? '데이터 부족' : data.mainVisitDays.days.join('·')}
            </div>
          </div>
           <div className="text-[10px] text-gray-400 leading-tight">
            {data.estimatedMonthlySales.max <= 0 ? '-' : data.mainVisitDays.comment}
           </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-3.5 flex flex-col justify-between h-28 bg-white hover:shadow-sm transition-shadow">
           <div>
            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">핵심 고객층</div>
            <div className={`text-base font-bold ${data.estimatedMonthlySales.max <= 0 ? 'text-gray-400 text-xs' : 'text-gray-900'}`}>
              {data.estimatedMonthlySales.max <= 0 ? '데이터 부족' : data.coreCustomer.ageGroup}
            </div>
          </div>
           <div className="text-[10px] text-gray-400 leading-tight">
            {data.estimatedMonthlySales.max <= 0 ? '-' : data.coreCustomer.comment}
           </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-3.5 flex flex-col justify-between h-28 bg-white hover:shadow-sm transition-shadow">
           <div>
            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">경쟁 강도(반경 500m)</div>
            <div className="text-base font-bold text-gray-900">{data.competitionIntensity.level}</div>
          </div>
           <div className="text-[10px] text-gray-400 line-clamp-2 overflow-hidden leading-tight" title={data.competitionIntensity.comment}>
            {data.competitionIntensity.comment}
           </div>
        </div>
      </div>
    </div>
  );
};
