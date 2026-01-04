'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { IndustryCategoryBreakdown } from '../../types/market-types';

interface IndustryRevenueSectionProps {
  breakdown: IndustryCategoryBreakdown[];
}

export default function IndustryRevenueSection({
  breakdown,
}: IndustryRevenueSectionProps) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  if (!breakdown || breakdown.length === 0) return null;

  const totalRevenue = breakdown.reduce(
    (acc, cat) => acc + cat.totalRevenue,
    0,
  );

  const formatRevenue = (amount: number) => {
    return `${(amount / 100000000).toFixed(1)}억`;
  };

  // Find max category for caption
  const maxCategory = breakdown.reduce((prev, current) =>
    prev.totalRevenue > current.totalRevenue ? prev : current,
  );
  const maxPercentage = Math.round(
    (maxCategory.totalRevenue / totalRevenue) * 100,
  );

  return (
    <div className="space-y-4 pt-6 border-t border-gray-100">
      {/* Header & Caption */}
      <div className="px-1">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-[15px] font-bold text-gray-900">
            업종별 매출 비중 분석
          </h4>
          <div className="relative group">
            <Info size={14} className="text-gray-400 cursor-help" />
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 w-max px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-sm">
              상권 내 주요 업종별 매출 점유율
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-[12px] font-semibold text-gray-500 mb-1">
            업종 점유율 요약
          </h4>
          <div className="text-[15px] font-bold text-gray-900 leading-tight">
            현재 상권은{' '}
            <span className="text-[#D9515E]">{maxCategory.macroName}</span>
            이(가)
            <span className="text-[#D9515E]"> {maxPercentage}%</span>로 가장 큰
            비중을 차지해요!
          </div>
        </div>
      </div>

      {/* Graph Area Container */}
      <div className="space-y-2.5 bg-slate-50/50 p-3 rounded-lg border border-gray-100/50">
        {breakdown.map((category) => {
          const isExpanded = expandedCode === category.macroCode;
          const ratio = (category.totalRevenue / totalRevenue) * 100;
          const isMax = category.macroCode === maxCategory.macroCode;

          return (
            <div
              key={category.macroCode}
              className={`group overflow-hidden rounded-lg bg-white border border-gray-100 transition-all hover:border-blue-200 ${
                isExpanded ? 'shadow-sm ring-1 ring-blue-100' : ''
              }`}
            >
              {/* Macro Category Bar */}
              <div
                className="cursor-pointer p-2.5"
                onClick={() =>
                  setExpandedCode(isExpanded ? null : category.macroCode)
                }
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-gray-800">
                      {category.macroName}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      {ratio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-900">
                      {formatRevenue(category.totalRevenue)}
                    </span>
                    <svg
                      className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-50">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isMax ? 'bg-[#E5858E]' : 'bg-[#90AFFF]'
                    }`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>

              {/* Sub Industries (Accordion Content) */}
              {isExpanded && (
                <div className="border-t border-gray-50 bg-gray-50/30 px-3 py-2.5 space-y-2">
                  {category.subIndustries.map((sub) => {
                    const subRatio =
                      (sub.revenue / category.totalRevenue) * 100;
                    return (
                      <div key={sub.code} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600 font-medium">
                            {sub.name}
                          </span>
                          <span className="text-gray-900 font-bold">
                            {formatRevenue(sub.revenue)}
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200/50">
                          <div
                            className="h-full bg-slate-300 transition-all duration-500"
                            style={{ width: `${subRatio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
