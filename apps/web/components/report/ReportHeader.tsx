import React from 'react';

interface ReportHeaderProps {
  category: string;
  region: string;
  generatedAt: string;
  isSecondPage?: boolean;
  meta?: {
    radius: number;
    period: string;
  };
}

export const ReportHeader = ({ category, region, generatedAt, isSecondPage = false, meta }: ReportHeaderProps) => {
  return (
    <div className="w-full border-b border-gray-200 pb-4">
      <div className="flex justify-between items-end mb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {isSecondPage ? '상권 분석 상세 요약' : '상권 분석 요약 보고서'}
        </h1>
        <span className="text-sm text-gray-500">보고서 생성일: {generatedAt}</span>
      </div>
      
      {!isSecondPage ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>업종: <span className="text-gray-900 font-medium">{category}</span></span>
          <span className="text-gray-300">|</span>
          <span>지역: <span className="text-gray-900 font-medium">{region}</span></span>
        </div>
      ) : meta ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
           <span>대상: {region}</span>
           <span className="text-gray-300">|</span>
           <span>반경: {meta.radius}m</span>
           <span className="text-gray-300">|</span>
           <span>기간: {meta.period}</span>
        </div>
      ) : null}

      {!isSecondPage ? (
        <div className="mt-4">
           <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
             <span className="text-blue-500 mr-1">●</span> 요약 중심
           </span>
        </div>
      ) : (
         <div className="mt-4">
           <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
             <span className="text-blue-500 mr-1">●</span> 정리/요약 + 방향성 힌트
           </span>
        </div>
      )}
    </div>
  );
};
