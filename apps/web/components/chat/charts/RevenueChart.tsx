'use client';

import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

/**
 * RevenueChart - 매출/수익 분석 차트 컴포넌트
 *
 * 차분하고 단정한 디자인 (위 텍스트와 싱크)
 */

interface RevenueData {
  revenue: number;
  rent: number;
  variableCost: number;
  netProfit: number;
  profitMargin: number;
  rentCostRatio?: number;
}

interface RevenueChartProps {
  data: RevenueData | null;
  isLoading?: boolean;
  areaName?: string;
}

const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 100000000) {
    const uk = Math.floor(absAmount / 100000000);
    const man = Math.floor((absAmount % 100000000) / 10000);
    return `${uk}억 ${man.toLocaleString()}만`;
  }
  return `${Math.floor(absAmount / 10000).toLocaleString()}만`;
};

export function RevenueChart({ data, isLoading, areaName }: RevenueChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-slate-500">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const {
    revenue,
    rent,
    variableCost,
    netProfit,
    profitMargin,
    rentCostRatio,
  } = data;
  const totalCost = rent + variableCost;
  const isProfit = netProfit >= 0;
  const isHighRent = rentCostRatio && rentCostRatio > 15;

  // 비용 구조 비율
  const rentPercent = revenue > 0 ? (rent / revenue) * 100 : 0;
  const variablePercent = revenue > 0 ? (variableCost / revenue) * 100 : 0;
  const profitPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden my-4">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            <h3 className="text-body font-strong text-slate-700">
              수익 분석
              {areaName && (
                <span className="text-slate-400 font-medium ml-2">
                  {areaName}
                </span>
              )}
            </h3>
          </div>
          {isHighRent && (
            <span className="flex items-center gap-1.5 text-tiny font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
              <AlertCircle className="w-3.5 h-3.5" />
              임대료 비중 높음
            </span>
          )}
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        {/* 월 예상 매출 */}
        <div className="p-5 text-center">
          <div className="text-caption text-slate-400 mb-1">월 예상 매출</div>
          <div className="text-h3 font-bold text-slate-800">
            {formatCurrency(revenue)}
          </div>
        </div>

        {/* 예상 지출 */}
        <div className="p-5 text-center">
          <div className="text-caption text-slate-400 mb-1">예상 지출</div>
          <div className="text-h3 font-bold text-slate-800">
            {formatCurrency(totalCost)}
          </div>
        </div>

        {/* 순이익 - 강조 */}
        <div
          className={`p-5 text-center ${isProfit ? 'bg-emerald-50' : 'bg-red-50'}`}
        >
          <div
            className={`text-caption mb-1 ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}
          >
            순이익
          </div>
          <div
            className={`text-h3 font-bold ${isProfit ? 'text-emerald-700' : 'text-red-600'}`}
          >
            {!isProfit && '-'}
            {formatCurrency(netProfit)}
          </div>
        </div>

        {/* 이익률 */}
        <div className="p-5 text-center">
          <div className="text-caption text-slate-400 mb-1">이익률</div>
          <div className="text-h3 font-bold text-slate-800">
            {profitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 비용 구조 */}
      <div className="p-6">
        <div className="text-caption font-medium text-slate-500 mb-3">
          비용 구조
        </div>

        {/* 비율 바 */}
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex mb-4">
          <div
            className="bg-slate-500 h-full transition-all duration-500"
            style={{ width: `${rentPercent}%` }}
          />
          <div
            className="bg-slate-300 h-full transition-all duration-500"
            style={{ width: `${variablePercent}%` }}
          />
          <div
            className="bg-slate-700 h-full transition-all duration-500"
            style={{ width: `${Math.max(0, profitPercent)}%` }}
          />
        </div>

        {/* 범례 */}
        <div className="flex gap-6 text-caption">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-500"></div>
            <span className="text-slate-500">임대료</span>
            <span className="font-medium text-slate-700">
              {rentPercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-300"></div>
            <span className="text-slate-500">변동비</span>
            <span className="font-medium text-slate-700">
              {variablePercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-700"></div>
            <span className="text-slate-500">순이익</span>
            <span className="font-medium text-slate-700">
              {profitPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
