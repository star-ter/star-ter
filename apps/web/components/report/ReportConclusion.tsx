import React from 'react';
import { ConclusionItem } from '@/types/report.types';

interface ReportConclusionProps {
  data: ConclusionItem[];
}

export const ReportConclusion = ({ data }: ReportConclusionProps) => {
  return (
    <div className="w-full mt-8">
       <h3 className="text-sm font-bold text-gray-800 mb-6">9) 결론(요약)</h3>
       
       <div className="space-y-4">
          {data.map((item, idx) => (
             <div key={idx} className="flex gap-4 items-start">
                 <span className="flex-shrink-0 w-10 h-10 border border-blue-200 rounded text-xs font-bold text-gray-500 flex items-center justify-center bg-white">
                    {item.category}
                 </span>
                 <div className="text-sm text-gray-700 leading-relaxed pt-2">
                    {item.content.split(item.highlight || '___').map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                           <span className="font-bold text-gray-900">{item.highlight}</span>
                        )}
                      </span>
                    ))}
                 </div>
             </div>
          ))}
       </div>

       <div className="mt-8 text-[10px] text-gray-400">
         데이터 해석 범위(B): 핵심 지표 요약 + 패턴 정리 + 실행 힌트 수준(구체 전략/예측 모델 결과는 제외)
       </div>

       <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between text-[10px] text-gray-400">
          <span> ※ 본 결론은 추정 값입니다. 최종 판단은 유저의 몫이며, 저희 서비스는 결과에 책임지지 않습니다.</span>
          <span>페이지 2 / 2</span>
       </div>
    </div>
  );
};
