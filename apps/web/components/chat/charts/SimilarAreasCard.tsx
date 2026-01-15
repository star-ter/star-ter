"use client";

import React from "react";
import { Layers, MapPin, ChevronRight } from "lucide-react";

/**
 * SimilarAreasCard - 유사 상권 리스트 컴포넌트
 * 
 * 지역 선택지 스타일 (순위 색상 없음)
 */

interface SimilarAreaItem {
  areaCode: string;
  areaName: string;
  similarity: number;
  targetName?: string;
}

interface SimilarAreasData {
  targetAreaName: string;
  similarAreas: SimilarAreaItem[];
}

interface SimilarAreasCardProps {
  data: SimilarAreasData | null;
  isLoading?: boolean;
}

// 유사도에 따른 라벨
const getSimilarityLabel = (similarity: number) => {
  if (similarity >= 95) return "매우 유사";
  if (similarity >= 90) return "거의 동일";
  if (similarity >= 85) return "유사함";
  return "비슷함";
};

export function SimilarAreasCard({ data, isLoading }: SimilarAreasCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-5 h-5 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.similarAreas || data.similarAreas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          <span>유사한 상권을 찾을 수 없습니다.</span>
        </div>
      </div>
    );
  }

  const { targetAreaName, similarAreas } = data;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden my-4">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-slate-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-700">
              {targetAreaName}
              <span className="text-slate-400 font-normal ml-1">유사 상권</span>
            </h3>
            <p className="text-sm text-slate-400">
              연령대, 유동인구, 인구 구성 기준
            </p>
          </div>
        </div>
      </div>

      {/* 리스트 */}
      <div className="divide-y divide-slate-100">
        {similarAreas.map((area, index) => (
          <div
            key={area.areaCode || index}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
          >
            {/* 지역명 */}
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-300" />
              <span className="text-base font-medium text-slate-700">
                {area.areaName}
              </span>
            </div>

            {/* 유사도 */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-base font-semibold text-slate-600">
                  {area.similarity.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-400">
                  {getSimilarityLabel(area.similarity)}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
