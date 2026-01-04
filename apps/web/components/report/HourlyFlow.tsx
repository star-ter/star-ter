import React from 'react';
import { HourlyFlowData } from '@/types/report.types';

interface HourlyFlowProps {
  summary: string;
  data: HourlyFlowData[];
}

export const HourlyFlow = ({ summary, data }: HourlyFlowProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-4 h-full bg-white shadow-sm">
       <h3 className="text-sm font-bold text-gray-800 mb-1.5">6) 시간대별 유동(요약)</h3>
       <p className="text-[10px] text-gray-400 mb-3 leading-snug">{summary}</p>

       <div className="space-y-1.5 h-32 flex flex-col justify-center mt-2">
         {data.every(item => item.intensity === 0) ? (
           <div className="flex items-center justify-center text-gray-400 text-xs">
             데이터 부족
           </div>
         ) : (
           data.map((item, idx) => (
             <div key={idx} className="flex items-center text-[11px]">
                <span className="w-14 text-gray-500">{item.timeRange}</span>
                <div className="flex-1 flex items-center gap-2">
                   <div className="flex-1 bg-blue-50/50 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${item.intensity}%` }}
                      />
                   </div>
                   <span className="text-gray-400 text-[9px] w-6 text-right shrink-0">{item.level}</span>
                </div>
             </div>
           ))
         )}
       </div>
    </div>
  );
};
