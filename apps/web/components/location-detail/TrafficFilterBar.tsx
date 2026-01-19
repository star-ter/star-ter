'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Users, Settings2 } from 'lucide-react';
import { GenderFilter, AgeFilter, AGE_SLIDER_OPTIONS } from './types';

/**
 * 【TrafficFilterBar 컴포넌트】
 *
 * 유동인구 히트맵 필터바
 * - 하단 바: 시간 슬라이더 포함
 * - 필터 패널: 성별/연령 필터만
 */

interface TrafficFilterBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentHour: number;
  onHourChange: (hour: number) => void;
  genderFilter: GenderFilter;
  ageFilter: AgeFilter;
  onFilterChange: (gender: GenderFilter, age: AgeFilter) => void;
}

export function TrafficFilterBar({
  isPlaying,
  onTogglePlay,
  currentHour,
  onHourChange,
  genderFilter,
  ageFilter,
  onFilterChange,
}: TrafficFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const hourLabel = `${currentHour.toString().padStart(2, '0')}시`;
  const currentAgeLabel =
    AGE_SLIDER_OPTIONS.find((opt) => opt.value === ageFilter)?.label || '전체';
  const genderLabel =
    genderFilter === 'all' ? '전체' : genderFilter === 'male' ? '남성' : '여성';

  // 외부 클릭 시 패널 닫기 (토글 버튼 제외)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 토글 버튼 클릭은 무시 (버튼 자체에서 처리)
      if (target.closest('[data-toggle-panel]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isExpanded]);

  return (
    <>
      {/* 필터 패널 (성별/연령만) */}
      {isExpanded && (
        <div
          ref={panelRef}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-4 w-95"
        >
          {/* 성별 필터 */}
          <div className="mb-3">
            <span className="text-tiny font-medium text-gray-500 block mb-1.5">성별</span>
            <div className="flex gap-1">
              {(['all', 'male', 'female'] as GenderFilter[]).map((g) => (
                <button
                  key={g}
                  onClick={() => onFilterChange(g, ageFilter)}
                  className={`flex-1 py-1.5 rounded-lg text-tiny font-medium transition-colors ${
                    genderFilter === g
                      ? 'bg-blue-950 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {g === 'all' ? '전체' : g === 'male' ? '남성' : '여성'}
                </button>
              ))}
            </div>
          </div>

          {/* 연령대 필터 */}
          <div>
            <span className="text-tiny font-medium text-gray-500 block mb-1.5">연령대</span>
            <div className="grid grid-cols-4 gap-1">
              {AGE_SLIDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange(genderFilter, opt.value)}
                  className={`py-1.5 rounded-lg text-tiny font-medium transition-colors ${
                    ageFilter === opt.value
                      ? 'bg-blue-950 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 하단 바 (시간 슬라이더 포함) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-200 w-95 justify-between">
          {/* 재생/일시정지 버튼 */}
          <button
            onClick={onTogglePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isPlaying
                ? 'bg-blue-950 text-white'
                : 'bg-blue-50 text-blue-950 hover:bg-blue-100'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* 시간 슬라이더 */}
          <div className="flex items-center gap-2">
            <span className="text-caption font-bold text-blue-950 w-10">{hourLabel}</span>
            <input
              type="range"
              min="0"
              max="23"
              value={currentHour}
              onChange={(e) => onHourChange(parseInt(e.target.value))}
              className="w-28 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:bg-blue-950
                [&::-webkit-slider-thumb]:rounded
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:bg-blue-950
                [&::-moz-range-thumb]:rounded
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:shadow-md"
            />
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* 필터 정보 + 설정 버튼 */}
          <button
            data-toggle-panel
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
              isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4 text-blue-950 shrink-0" />
            <span className="text-caption font-medium text-blue-900 whitespace-nowrap">
              {genderLabel} · {currentAgeLabel}
            </span>
            <Settings2 className={`w-4 h-4 transition-colors ${isExpanded ? 'text-blue-950' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>
    </>
  );
}
