import React from 'react';
import { WeeklyCharacteristicsData } from '@/types/report.types';

interface WeeklyCharacteristicsProps {
  data: WeeklyCharacteristicsData[];
}

export const WeeklyCharacteristics = ({ data }: WeeklyCharacteristicsProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-6 h-full">
       <h3 className="text-sm font-bold text-gray-800 mb-4">7) 요일별 특성(요약)</h3>
       <div className="w-full">
          <table className="w-full text-xs text-left">
             <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                   <th className="pb-2 font-medium w-12">요일</th>
                   <th className="pb-2 font-medium">유동/수요 특성</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100/50">
                {data.map((item, idx) => (
                   <tr key={idx}>
                      <td className="py-3 font-medium text-gray-800 align-top">{item.day}</td>
                      <td className="py-3 text-gray-600 leading-relaxed">{item.characteristics}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};
