import React from 'react';
import { CompetitionTableItem } from '@/types/report.types';

interface CompetitionAnalysisProps {
  data: CompetitionTableItem[];
}

export const CompetitionAnalysis = ({ data }: CompetitionAnalysisProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-4 mt-4 bg-white shadow-sm">
       <h3 className="text-sm font-bold text-gray-800 mb-2.5">8) 경쟁/상권 구조(요약)</h3>
       <div className="w-full overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-[11px] text-left">
             <thead className="bg-gray-50/50 text-gray-400">
                <tr>
                   <th className="py-2.5 px-3 font-medium w-24 border-r border-gray-100/50">항목</th>
                   <th className="py-2.5 px-4 font-medium">요약</th>
                   <th className="py-2.5 px-4 font-medium w-40">시사점</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {data.map((item, idx) => (
                   <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-gray-800 border-r border-gray-50">{item.category}</td>
                      <td className="py-2.5 px-4 text-gray-600 leading-normal">{item.summary}</td>
                      <td className="py-2.5 px-4 text-gray-600 leading-normal">{item.implication}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};
