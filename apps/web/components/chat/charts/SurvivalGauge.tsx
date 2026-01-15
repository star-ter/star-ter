"use client";

import React from "react";
import { TrendingDown, Clock, Building2 } from "lucide-react";

/**
 * SurvivalGauge - 생존 점수 게이지 컴포넌트
 * 
 * 차분하고 일관된 색상 테마 (slate/blue 베이스)
 * 점수에 따른 포인트 색상은 원형 게이지에만 적용
 */

interface SurvivalData {
  score: number;
  interpretation: string;
  closingRate: number;
  avgOperationMonths: number;
  changeStatus?: string;
  dataSource?: string;
}

interface SurvivalGaugeProps {
  data: SurvivalData | null;
  isLoading?: boolean;
  areaName?: string;
}

// 점수에 따른 메인 색상 (게이지에만 사용)
const getScoreAccent = (score: number) => {
  if (score >= 80) return "#10b981"; // emerald
  if (score >= 60) return "#3b82f6"; // blue
  if (score >= 40) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

// 상태 레이블
const getStatusLabel = (score: number) => {
  if (score >= 80) return "안전";
  if (score >= 60) return "양호";
  if (score >= 40) return "주의";
  return "위험";
};

// 원형 게이지 SVG
const CircularGauge = ({ score, size = 160 }: { score: number; size?: number }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 99) * circumference;
  const accentColor = getScoreAccent(score);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* 중앙 점수 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-slate-800">{score}</span>
        <span className="text-sm text-slate-400">/99점</span>
      </div>
    </div>
  );
};

export function SurvivalGauge({
  data,
  isLoading,
  areaName,
}: SurvivalGaugeProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="h-20 bg-slate-100 rounded-lg"></div>
          <div className="h-20 bg-slate-100 rounded-lg"></div>
          <div className="h-20 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-40 bg-slate-50 rounded-lg"></div>
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

  const { score, interpretation, closingRate, avgOperationMonths, changeStatus, dataSource } = data;
  const accentColor = getScoreAccent(score);
  const statusLabel = getStatusLabel(score);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden my-4">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">생존 분석</h3>
            {areaName && <p className="text-sm text-slate-500">{areaName}</p>}
          </div>
          <span 
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: accentColor }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* 핵심 지표 3개 */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {/* 폐업률 */}
        <div className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">폐업률</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{closingRate}%</div>
          <div className="text-xs text-slate-400 mt-1">
            {closingRate <= 10 ? "낮음" : closingRate <= 18 ? "보통" : "높음"}
          </div>
        </div>

        {/* 평균 영업 */}
        <div className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">평균 영업</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{avgOperationMonths}개월</div>
          <div className="text-xs text-slate-400 mt-1">
            {avgOperationMonths >= 60 ? "안정적" : avgOperationMonths >= 36 ? "보통" : "불안정"}
          </div>
        </div>

        {/* 상권 상태 */}
        <div className="p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">상권 상태</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{changeStatus || "-"}</div>
          {dataSource && <div className="text-xs text-slate-400 mt-1">{dataSource}</div>}
        </div>
      </div>

      {/* 메인 점수 섹션 */}
      <div className="p-6">
        <div className="flex items-center gap-8">
          {/* 원형 게이지 */}
          <CircularGauge score={score} />

          {/* 해석 텍스트 */}
          <div className="flex-1">
            <h4 className="text-xl font-semibold text-slate-800 mb-2">
              {interpretation}
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              이 상권에서 창업 시 예상되는 생존 가능성을 종합 평가한 점수입니다. 
              폐업률과 평균 영업 기간을 기반으로 산출됩니다.
            </p>

            {/* 심플한 진행 바 */}
            <div className="mt-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(score / 99) * 100}%`,
                    backgroundColor: accentColor 
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0</span>
                <span>99</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
