'use client';

import { useState } from 'react';
import { Target, AlertCircle, Clock, Wallet, Building2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isChartOpen, setIsChartOpen] = useState(true);

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
  const rampMonthsRaw = paybackMonths ?? 12;
  // Allow showing up to 60 months (5 years). If longer, it clamps at 60.
  const rampMonths = Math.max(6, Math.min(60, rampMonthsRaw));
  // Ensure the chart always extends a bit past the break-even point
  const timelineMonths = rampMonths + 6;
  
  const hasTimeline = bepRevenue > 0 && totalFixedCost > 0;

  const revenueSeries = hasTimeline
    ? Array.from({ length: timelineMonths + 1 }, (_, month) => {
        if (month <= rampMonths) {
          return (bepRevenue * month) / rampMonths;
        }
        const extraMonths = timelineMonths - rampMonths;
        if (extraMonths <= 0) return bepRevenue;
        const growth = 0.2 * bepRevenue;
        return bepRevenue + (growth * (month - rampMonths)) / extraMonths;
      })
    : [];

  const costSeries = hasTimeline
    ? revenueSeries.map(
        (revenue) => totalFixedCost + revenue * variableRate,
      )
    : [];

  const chartWidth = 320;
  const chartHeight = 140;
  const maxValue = hasTimeline
    ? Math.max(...revenueSeries, ...costSeries) * 1.08
    : 1;
  const toX = (month: number) => (month / timelineMonths) * chartWidth;
  const toY = (value: number) =>
    chartHeight - (value / maxValue) * chartHeight;

  const breakevenMonth = Math.min(rampMonths, timelineMonths);
  const breakevenX = toX(breakevenMonth);
  const breakevenY = toY(bepRevenue);

  const generatePathWithPathThroughBEP = (series: number[]) => {
    if (!hasTimeline) return '';
    return series
      .map((value, index) => {
        const x = toX(index);
        const y = toY(value);
        let cmd = index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        
        // If this segment spans across the break-even month, insert the BEP vertex
        if (index > 0 && index - 1 < breakevenMonth && index > breakevenMonth) {
           // We are drawing from (prevX, prevY) to (x, y). 
           // Insert (breakevenX, breakevenY) in between.
           // Actually since map returns strings, we can't easily inject a previous command's modification.
           // Better strategy: simply prepend the BEP point to the current command if applicable.
           cmd = `L ${breakevenX} ${breakevenY} L ${x} ${y}`;
        }
        return cmd;
      })
      .join(' ');
  };

  const revenuePath = hasTimeline ? generatePathWithPathThroughBEP(revenueSeries) : '';
  const costPath = hasTimeline ? generatePathWithPathThroughBEP(costSeries) : '';

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
      <div 
        className="px-6 py-6 border-b border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsChartOpen(!isChartOpen)}
      >
        <div className="text-center relative">
          <div className="text-caption text-slate-500 mb-1 flex items-center justify-center gap-1">
            월 손익분기 매출액
            {isChartOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
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

      {/* 비용/매출 추정 차트 */}
      {isChartOpen && (
        <div className="px-6 py-5 border-b border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="text-caption text-slate-500">
              월 매출 vs 비용 추정 (손익분기 시점 강조)
            </div>
            {hasTimeline && (
              <span className="text-tiny text-slate-500">
                가정: {rampMonths}개월 내 BEP 도달
              </span>
            )}
          </div>
          {hasTimeline ? (
            <div>
              {/* Chart Container */}
              <div className="relative w-full h-[160px]">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox={`0 -20 ${chartWidth} ${chartHeight + 20}`}
                  preserveAspectRatio="none"
                >
                  {/* Loss Area (Red) - cost is higher than revenue */}
                  <path
                    d={`
                  M 0,${toY(costSeries[0])}
                  L ${breakevenX},${breakevenY}
                  L 0,${toY(revenueSeries[0])}
                  Z
                `}
                    className="fill-red-500/10"
                  />

                  {/* Profit Area (Blue) - revenue is higher than cost */}
                  {timelineMonths > breakevenMonth && (
                    <path
                      d={`
                    M ${breakevenX},${breakevenY}
                    L ${toX(timelineMonths)},${toY(costSeries[timelineMonths])}
                    L ${toX(timelineMonths)},${toY(revenueSeries[timelineMonths])}
                    Z
                  `}
                      className="fill-blue-500/10"
                    />
                  )}

                  {/* Lines */}
                  <path
                    d={costPath}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d={revenuePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />

                  {/* Vertical Line */}
                  <line
                    x1={breakevenX}
                    y1="0"
                    x2={breakevenX}
                    y2={chartHeight}
                    stroke="#CBD5F5"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* HTML Overlay for Marker and Label to prevent aspect ratio distortion */}
                <div
                  className="absolute pointer-events-none w-0 h-0"
                  style={{
                    left: `${(breakevenX / chartWidth) * 100}%`,
                    top: `${((breakevenY + 20) / (chartHeight + 20)) * 100}%`,
                  }}
                >
                  {/* Marker Point (Centered on the point) */}
                  <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/40 rounded-full animate-ping" />
                    <div className="w-4 h-4 bg-[#2563EB] border-[4px] border-white rounded-full relative z-10 shadow-sm box-content" />
                  </div>

                  {/* Label Box (Positioned above the point) */}
                  <div
                    className="absolute bottom-6 left-0 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#2563EB] rounded-full text-white text-[11px] font-bold shadow-md whitespace-nowrap z-10"
                  >
                    손익분기점
                    {/* Arrow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#2563EB]" />
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-tiny text-slate-400">
                <span>0개월</span>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-3 rounded-full bg-[#2563EB]"></span>
                    매출
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-3 rounded-full bg-[#94A3B8]"></span>
                    비용
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-100 border border-red-200"></span>
                    적자구간
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-100 border border-blue-200"></span>
                    흑자구간
                  </span>
                </div>
                <span>{timelineMonths}개월</span>
              </div>
            </div>
          ) : (
            <div className="text-caption text-slate-500">
              손익분기 추정을 표시할 수 없습니다.
            </div>
          )}
        </div>
      )}

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
