import React from 'react';
import { SummaryInsight } from '@/types/report.types';

interface SummaryInsightsProps {
  data: SummaryInsight[];
}

export const SummaryInsights = ({ data }: SummaryInsightsProps) => {
  return (
    <div className="w-full mt-8">
       <h3 className="text-sm font-bold text-gray-800 mb-4">5) 요약 인사이트 (B 범위)</h3>
       <div className="space-y-4">
          {data.map((insight, idx) => (
            <div key={idx} className="flex gap-4 items-start">
               <span className="flex-shrink-0 w-10 h-10 border border-blue-200 rounded text-xs font-bold text-gray-500 flex items-center justify-center bg-white">
                  {insight.category}
               </span>
               <div className="text-sm text-gray-700 leading-relaxed pt-2">
                  {insight.content.split(insight.highlight || '___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                         <span className="font-bold text-gray-900">{insight.highlight}</span>
                      )}
                    </span>
                  ))}
               </div>
            </div>
          ))}
       </div>
       {/* Footer Note */}
       <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between text-[10px] text-gray-400">
          <span>주의: 본 문서는 추정 값입니다. 최종 판단은 유저의 몫이며, 저희 서비스는 결과에 책임지지 않습니다.</span>
          <span>페이지 1 / 2</span>
       </div>
    </div>
  );
};
