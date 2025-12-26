import React from 'react';

interface Props{
    isCommercialZone: boolean;
    areaName: string;
}


export default function MarketBadge({ isCommercialZone, areaName }: Props) {
  return (
    <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between ${
      isCommercialZone 
        ? 'bg-orange-50 border-orange-200' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{isCommercialZone ? '✨' : '🏠'}</span>
        <div>
          <div className="text-xs text-gray-500 mb-0.5">분석 지역</div>
          <div className={`text-lg font-bold ${isCommercialZone ? 'text-orange-700' : 'text-gray-900'}`}>
            {areaName}
          </div>
        </div>
      </div>
      {!isCommercialZone && (
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          데이터 부족
        </span>
      )}
    </div>
  );
}