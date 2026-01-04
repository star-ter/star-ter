import React from 'react';
import { ConclusionItem } from '@/types/report.types';

interface ReportConclusionProps {
  data: ConclusionItem[];
}

export const ReportConclusion = ({ data }: ReportConclusionProps) => {
  return (
    <div className="w-full mt-6">
       <h3 className="text-sm font-bold text-gray-800 mb-3">9) 결론(요약)</h3>
       
       <div className="space-y-2.5">
          {data.map((item, idx) => (
             <div key={idx} className="flex gap-3.5 items-start">
                  <span className="shrink-0 w-8 h-8 border border-blue-200 rounded-lg text-[10px] font-bold text-gray-500 flex items-center justify-center bg-white shadow-sm">
                     {item.category}
                  </span>
                  <div className="text-xs text-gray-700 leading-relaxed pt-1.5 flex-1">
                     {item.content.split(item.highlight || '___').map((part, i, arr) => (
                       <span key={i}>
                         {part}
                         {i < arr.length - 1 && (
                            <span className="font-bold text-gray-900 border-b-2 border-blue-100">{item.highlight}</span>
                         )}
                       </span>
                     ))}
                  </div>
             </div>
          ))}
       </div>

       <div className="mt-8 pt-3 border-t border-gray-100 flex justify-between text-[9px] text-gray-400">
          <span> ※ 본 결론은 추정 값입니다. 최종 판단은 유저의 몫이며, 저희 서비스는 결과에 책임지지 않습니다.</span>
          <span>페이지 2 / 2</span>
       </div>
    </div>
  );
};
