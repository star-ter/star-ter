import React from 'react';
import { WeeklyCharacteristicsData } from '@/types/report.types';

interface WeeklyCharacteristicsProps {
  data: WeeklyCharacteristicsData[];
}

export const WeeklyCharacteristics = ({ data }: WeeklyCharacteristicsProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-4 h-full bg-white shadow-sm">
       <h3 className="text-sm font-bold text-gray-800 mb-2.5">7) 요일별 특성(요약)</h3>
       <div className="w-full mt-1">
          <table className="w-full text-[11px] text-left">
             <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                   <th className="pb-1.5 font-medium w-10">요일</th>
                   <th className="pb-1.5 font-medium">유동/수요 특성</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {data.map((item, idx) => (
                   <tr key={idx}>
                      <td className="py-2.5 font-medium text-gray-800 align-top">{item.day}</td>
                      <td className="py-2.5 text-gray-600 leading-normal">{item.characteristics}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};
