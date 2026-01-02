import React from 'react';
import { CompetitionTableItem } from '@/types/report.types';

interface CompetitionAnalysisProps {
  data: CompetitionTableItem[];
}

export const CompetitionAnalysis = ({ data }: CompetitionAnalysisProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-6 mt-6">
       <h3 className="text-sm font-bold text-gray-800 mb-4">8) 경쟁/상권 구조(요약)</h3>
       <div className="w-full overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-xs text-left">
             <thead className="bg-gray-50 text-gray-500">
                <tr>
                   <th className="py-3 px-4 font-medium w-24">항목</th>
                   <th className="py-3 px-4 font-medium">요약</th>
                   <th className="py-3 px-4 font-medium w-40">시사점(B)</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {data.map((item, idx) => (
                   <tr key={idx}>
                      <td className="py-3 px-4 font-medium text-gray-800">{item.category}</td>
                      <td className="py-3 px-4 text-gray-600">{item.summary}</td>
                      <td className="py-3 px-4 text-gray-600">{item.implication}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};
