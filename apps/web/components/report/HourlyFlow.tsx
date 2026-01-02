import React from 'react';
import { HourlyFlowData } from '@/types/report.types';

interface HourlyFlowProps {
  summary: string;
  data: HourlyFlowData[];
}

export const HourlyFlow = ({ summary, data }: HourlyFlowProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-6 h-full">
       <h3 className="text-sm font-bold text-gray-800 mb-2">6) 시간대별 유동(요약)</h3>
       <p className="text-xs text-gray-400 mb-6">{summary}</p>

       <div className="space-y-4">
         {data.map((item, idx) => (
           <div key={idx} className="flex items-center text-xs">
              <span className="w-16 text-gray-500">{item.timeRange}</span>
              <div className="flex-1 flex items-center gap-2">
                 <div className="flex-1 bg-blue-50 h-2 rounded-full overflow-hidden max-w-[150px]">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${item.intensity}%` }}
                    />
                 </div>
                 <span className="text-gray-400 text-[10px] w-8 text-right">{item.level}</span>
              </div>
           </div>
         ))}
       </div>
    </div>
  );
};
