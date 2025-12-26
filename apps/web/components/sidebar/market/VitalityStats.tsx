import React from 'react';

interface Props {
  openingRate: number;
  closureRate: number;
}

export default function VitalityStats({ openingRate, closureRate }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 px-1">📊 상권 생명력</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* 개업률 카드 */}
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
          <div className="text-xs font-medium text-blue-600 mb-1">개업률</div>
          <div className="text-xl font-bold text-blue-700">{openingRate}%</div>
        </div>
        {/* 폐업률 카드 */}
        <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 text-center">
          <div className="text-xs font-medium text-red-600 mb-1">폐업률</div>
          <div className="text-xl font-bold text-red-700">{closureRate}%</div>
        </div>
      </div>
    </div>
  );
}