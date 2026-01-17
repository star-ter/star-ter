'use client';

/**
 * TrafficContent - 유동인구 분석 컴포넌트
 *
 * 【주요 개념】
 * 1. Props를 통한 데이터 전달: 부모 컴포넌트(LocationDetailPage)에서
 *    API 데이터를 받아 표시합니다.
 *
 * 2. 조건부 렌더링 (Conditional Rendering):
 *    데이터가 없을 때 로딩 UI를 표시하고, 있을 때 실제 콘텐츠를 표시합니다.
 *
 * 3. SVG 기반 차트:
 *    외부 라이브러리 없이 순수 SVG로 라인 차트와 막대 차트를 구현합니다.
 */

import { Users, Clock, Calendar } from 'lucide-react';
import type { FootTrafficAnalysis } from './types';

interface TrafficContentProps {
  /**
   * 유동인구 분석 데이터
   * null이면 로딩 중 또는 데이터 없음 상태
   */
  footTraffic: FootTrafficAnalysis | null;
  /** 지역 코드 (데이터 fetch용, 옵션) */
  regionCode?: string;
}

/**
 * 숫자를 "약 N만명" 또는 "약 N천명" 형식으로 포맷
 */
function formatPopulation(count: number): string {
  if (count >= 10000) {
    return `약 ${Math.round(count / 10000).toLocaleString()}만명`;
  }
  if (count >= 1000) {
    return `약 ${Math.round(count / 1000).toLocaleString()}천명`;
  }
  return `약 ${count.toLocaleString()}명`;
}

export function TrafficContent({ footTraffic }: TrafficContentProps) {
  // -------------------------
  // 데이터가 없을 때 로딩/빈 상태 표시
  // -------------------------
  if (!footTraffic) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">유동인구 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // -------------------------
  // 시간대별 차트 데이터 준비
  // -------------------------
  const timeData = footTraffic.timeSlotRatio;
  const maxTimeRatio = Math.max(...timeData.map((d) => d.ratio));

  // -------------------------
  // 연령대별 차트 데이터 준비
  // -------------------------
  const ageData = footTraffic.ageGroupRatio;
  const maxAgeRatio = Math.max(...ageData.map((d) => d.ratio));

  return (
    <div className="space-y-8">
      <div className="grid gap-4">
        <h2 className="text-h2 font-bold text-foreground">
          유동인구 분석 결과
        </h2>
        {/* =====================================================
          상단 요약 카드 3개
          - 일일 유동인구
          - 피크 시간대
          - 성별 비율
          ===================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 카드 1: 일일 유동인구 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-body text-foreground font-bold">
                일일 유동인구
              </span>
            </div>
            <p className="text-h2 font-bold text-foreground">
              {formatPopulation(footTraffic.dailyTotal)}
            </p>
            <div className="flex justify-between text-caption text-gray-500 mt-1 font-strong">
              <span>일 평균 기준</span>
            </div>
          </div>

          {/* 카드 2: 피크 시간대 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="text-body text-foreground font-bold">
                피크 시간대
              </span>
            </div>
            <p className="text-h2 font-bold text-foreground">
              {footTraffic.peakTimeSlot}
            </p>
            <div className="flex justify-between text-caption text-gray-500 mt-1 font-strong">
              <span>유동인구 집중시간</span>
            </div>
          </div>

          {/* 카드 3: 성별 비율 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <span className="text-body text-foreground font-bold">
                성별 비율
              </span>
            </div>
            {/* 성별 비율 바 */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gender-male font-medium text-caption">
                    남성
                  </span>
                  <span className="text-gender-female font-medium text-caption">
                    여성
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gender-male transition-all duration-700"
                    style={{ width: `${footTraffic.genderRatio.male}%` }}
                  />
                  <div
                    className="h-full bg-gender-female transition-all duration-700"
                    style={{ width: `${footTraffic.genderRatio.female}%` }}
                  />
                </div>
                <div className="flex justify-between text-caption text-primary mt-1 font-semibold">
                  <span>{footTraffic.genderRatio.male}%</span>
                  <span>{footTraffic.genderRatio.female}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          시간대별 방문 비중 상세 (라인 차트)
          ===================================================== */}
      <div className="grid gap-4">
        <h2 className="text-h2 font-bold text-foreground">
          시간대별 방문 비중 상세
        </h2>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center mb-10">
            <div className="flex items-center gap-2 text-caption text-gray-500">
              <span className="w-3 h-3 rounded-full bg-primary" />
              방문 비중(%)
            </div>
          </div>

          {/* 라인 차트 - SVG (비율 유지) + HTML 라벨 */}
          <div className="relative">
            {/* Y축 라벨 (HTML) */}
            <div className="absolute left-0 top-0 h-44 w-8 flex flex-col justify-between text-right text-body text-gray-700 pr-2">
              <span>{Math.round(maxTimeRatio)}%</span>
              <span>{Math.round(maxTimeRatio / 2)}%</span>
              <span>0%</span>
            </div>

            {/* 차트 영역 - 라벨 공간 적절히 확보 */}
            <div className="ml-10 relative h-44 mb-12">
              {/* SVG 차트 (라인 + 쉐이딩) */}
              <svg
                className="w-full h-full absolute inset-0"
                viewBox="0 0 540 160"
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
              >
                {/* 그리드 라인 */}
                <line
                  x1="20"
                  y1="0"
                  x2="520"
                  y2="0"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1="20"
                  y1="80"
                  x2="520"
                  y2="80"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1="20"
                  y1="160"
                  x2="520"
                  y2="160"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />

                <defs>
                  <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#172554" stopOpacity="0.15" />
                    <stop
                      offset="100%"
                      stopColor="#172554"
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                </defs>

                {/* 영역 채우기 */}
                <path
                  d={`
                  M 20 ${160 - (timeData[0]?.ratio / maxTimeRatio) * 140}
                  ${timeData
                    .map((d, i) => {
                      const x = 20 + (i / (timeData.length - 1)) * 500;
                      const y = 160 - (d.ratio / maxTimeRatio) * 140;
                      return `L ${x} ${y}`;
                    })
                    .join(' ')}
                  L 520 160
                  L 20 160
                  Z
                `}
                  fill="url(#lineGradient)"
                />

                {/* 라인 */}
                <polyline
                  points={timeData
                    .map((d, i) => {
                      const x = 20 + (i / (timeData.length - 1)) * 500;
                      const y = 160 - (d.ratio / maxTimeRatio) * 140;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#172554"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* HTML 데이터 포인트 (찌그러짐 방지) */}
              {timeData.map((d, i) => {
                // X 위치: SVG 좌표 20~520 (전체 540)를 퍼센트로 변환
                const leftPercent =
                  ((20 + (i / (timeData.length - 1)) * 500) / 540) * 100;
                // Y 위치: 높이 140 (전체 160)를 퍼센트로 변환
                const bottomPercent =
                  (((d.ratio / maxTimeRatio) * 140) / 160) * 100;

                return (
                  <div
                    key={i}
                    className="absolute w-6 h-6 bg-white border-[5px] border-primary rounded-full z-10 box-border"
                    style={{
                      left: `${leftPercent}%`,
                      bottom: `${bottomPercent}%`,
                      transform: 'translate(-50%, 50%)', // 중앙 정렬
                    }}
                  />
                );
              })}

              {/* X축 라벨 (HTML) - 포인트 위치와 정확히 일치, 일직선 배치 */}
              <div className="absolute top-full left-0 right-0 h-10 mt-3">
                {timeData.map((d, i) => {
                  const leftPercent =
                    ((20 + (i / (timeData.length - 1)) * 500) / 540) * 100;

                  return (
                    <span
                      key={d.timeRange}
                      className="absolute text-center text-body font-strong text-gray-600 whitespace-nowrap"
                      style={{
                        left: `${leftPercent}%`,
                        transform: 'translateX(-50%)', // top 제거하여 일직선 유지
                      }}
                    >
                      {d.timeRange.replace('시', '')}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          연령대별 방문 비중 상세 (막대 차트)
          ===================================================== */}
      <div className="grid gap-4">
        <h2 className="text-h2 font-bold text-foreground">
          연령대별 방문 비중 상세
        </h2>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-caption text-gray-500">
              <Users className="w-4 h-4" />
              방문 비율 (%)
            </div>
          </div>

          {/* 막대 차트 */}
          <div className="flex items-end justify-around gap-6 h-56 px-4 mt-10">
            {ageData.map((d) => {
              // 가장 높은 비율인 연령대는 Info(Blue), 나머지는 Primary(Navy)
              const isMax = d.ratio === maxAgeRatio;
              const barColor = isMax ? 'bg-info' : 'bg-primary';
              const barHeight = (d.ratio / maxAgeRatio) * 100;

              return (
                <div
                  key={d.ageGroup}
                  className="flex flex-col items-center flex-1"
                >
                  {/* 비율 텍스트 */}
                  <span
                    className={`text-body font-strong mb-2 ${isMax ? 'text-info' : 'text-primary'}`}
                  >
                    {d.ratio}%
                  </span>

                  {/* 막대 */}
                  <div className="w-full max-w-16 h-40 bg-gray-100 rounded-t-xl relative flex items-end">
                    <div
                      className={`w-full ${barColor} rounded-t-xl transition-all duration-700`}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>

                  {/* 연령대 라벨 */}
                  <span
                    className={`text-body mt-3 ${isMax ? 'font-strong text-info' : 'font-bold text-primary'}`}
                  >
                    {d.ageGroup}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
