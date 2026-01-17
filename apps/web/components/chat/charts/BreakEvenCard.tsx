'use client';

import React from 'react';
import { Target, AlertCircle, Clock, Wallet, Building2 } from 'lucide-react';

/**
 * BreakEvenCard - 손익분기점 분석 카드 컴포넌트
 *
 * 차분하고 깔끔한 디자인 (다른 컴포넌트와 일관된 스타일)
 */

interface BreakEvenData {
  bepRevenue: number;
  totalFixedCost: number;
  rent: number;
  laborCost?: number;
  variableRate: number;
  deposit?: number;
  paybackMonths?: number;
}

interface BreakEvenCardProps {
  data: BreakEvenData | null;
  isLoading?: boolean;
  listingId?: string;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 100000000) {
    const uk = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `${uk}억 ${man.toLocaleString()}만` : `${uk}억`;
  }
  return `${Math.floor(amount / 10000).toLocaleString()}만`;
};

export function BreakEvenCard({ data, isLoading }: BreakEvenCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="p-6 space-y-4">
          <div className="h-24 bg-slate-100 rounded-lg"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
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
    bepRevenue,
    totalFixedCost,
    rent,
    laborCost,
    variableRate,
    deposit,
    paybackMonths,
  } = data;
  const isLongPayback = paybackMonths && paybackMonths > 24;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden my-4">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-slate-400" />
            <h3 className="text-body font-strong text-slate-700">
              손익분기점 분석
            </h3>
          </div>
          {isLongPayback && (
            <span className="flex items-center gap-1.5 text-tiny font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
              <AlertCircle className="w-3.5 h-3.5" />
              회수기간 긴 편
            </span>
          )}
        </div>
      </div>

      {/* 메인 손익분기 매출 */}
      <div className="px-6 py-6 border-b border-slate-100 bg-slate-50">
        <div className="text-center">
          <div className="text-caption text-slate-500 mb-1">
            월 손익분기 매출액
          </div>
          <div className="text-h1 font-bold text-slate-800">
            {formatCurrency(bepRevenue)}
            <span className="text-h3 text-slate-400 font-normel ml-1">원</span>
          </div>
          {paybackMonths && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-caption text-slate-600">
                약{' '}
                <span className="font-storng text-slate-800">
                  {paybackMonths}개월
                </span>{' '}
                후 손익분기 도달
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="p-4 text-center">
          <div className="text-caption text-slate-400 mb-1">총 고정비</div>
          <div className="text-h4 font-bold text-slate-800">
            {formatCurrency(totalFixedCost)}
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-caption text-slate-400 mb-1">변동비율</div>
          <div className="text-h4 font-bold text-slate-800">
            {(variableRate * 100).toFixed(0)}%
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-caption text-slate-400 mb-1">공헌이익률</div>
          <div className="text-h4 font-bold text-slate-800">
            {((1 - variableRate) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* 고정비 내역 */}
      <div className="p-6">
        <div className="text-caption font-medium text-slate-500 mb-3">
          고정비 내역
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-caption text-slate-600">임대료</span>
            </div>
            <span className="text-body font-strong text-slate-700">
              {formatCurrency(rent)}원
            </span>
          </div>
          {laborCost && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span className="text-caption text-slate-600">인건비</span>
              </div>
              <span className="text-body font-strong text-slate-700">
                {formatCurrency(laborCost)}원
              </span>
            </div>
          )}
          {deposit && deposit > 0 && (
            <div className="flex items-center justify-between py-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-caption text-slate-600">보증금</span>
              </div>
              <span className="text-body font-strong text-slate-700">
                {formatCurrency(deposit)}원
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
