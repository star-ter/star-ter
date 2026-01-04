import React from 'react';
import { AgeDistributionData } from '@/types/report.types';

interface AgeDistributionProps {
  data: AgeDistributionData;
}

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-3 py-1 h-6">
    <span className="w-10 text-xs text-gray-600 shrink-0">{label}</span>
    <div className="flex-1 bg-blue-50/50 rounded-full h-2 overflow-hidden">
      <div 
         className="h-full bg-blue-500 rounded-full"
         style={{ width: `${(value / 50) * 100}%` }} 
      />
    </div>
    <span className="w-8 text-right text-[10px] text-gray-500 tabular-nums">{value}%</span>
  </div>
);

export const AgeDistribution = ({ data }: AgeDistributionProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-4 mt-3 bg-white">
      <div className="space-y-0.5">
        {data.age10 === 0 && data.age20 === 0 && data.age30 === 0 && data.age40 === 0 && data.age50Plus === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
            데이터 부족
          </div>
        ) : (
          <>
            <Row label="10대" value={data.age10} />
            <Row label="20대" value={data.age20} />
            <Row label="30대" value={data.age30} />
            <Row label="40대" value={data.age40} />
            <Row label="50대+" value={data.age50Plus} />
          </>
        )}
      </div>
    </div>
  );
};
