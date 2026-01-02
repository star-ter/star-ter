import React from 'react';
import { AgeDistributionData } from '@/types/report.types';

interface AgeDistributionProps {
  data: AgeDistributionData;
}

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-4 py-1.5 h-8">
    <span className="w-12 text-sm text-gray-600 flex-shrink-0">{label}</span>
    <div className="flex-1 bg-blue-50 rounded-full h-3 overflow-hidden">
      <div 
         className="h-full bg-blue-600 rounded-full"
         style={{ width: `${(value / 50) * 100}%` }} 
      />
    </div>
    <span className="w-8 text-right text-xs text-gray-500 tabular-nums">{value}%</span>
  </div>
);

export const AgeDistribution = ({ data }: AgeDistributionProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-5 mt-4">
      <h3 className="text-sm font-bold text-gray-800 mb-4">4) 연령대 분포(요약)</h3>
      <div className="space-y-1">
        <Row label="10대" value={data.age10} />
        <Row label="20대" value={data.age20} />
        <Row label="30대" value={data.age30} />
        <Row label="40대" value={data.age40} />
        <Row label="50대+" value={data.age50Plus} />
      </div>
    </div>
  );
};
