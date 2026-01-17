'use client';

import { AgeScoreData } from './types';
import { USER_LABELS } from './constants';

interface AgeScoreSectionProps {
  score: AgeScoreData;
  userAge: string;
}

export function AgeScoreSection({ score, userAge }: AgeScoreSectionProps) {
  // text color는 이제 사용하지 않고 항상 검은색 (text-slate-900)
  const percentage = Math.round(score.score * 100);
  const userLabel = USER_LABELS.age[userAge] || userAge;
  const { selected } = score.breakdown;

  // 도넛 차트 색상 결정 로직 (정밀 매칭 결과와 동일)
  const getChartColor = (percent: number) => {
    if (percent >= 80) return 'stroke-success';
    if (percent >= 60) return 'stroke-info';
    if (percent >= 40) return 'stroke-accent';
    return 'stroke-danger';
  };

  const chartColorClass = getChartColor(percentage);

  // 도넛 차트 계산
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const selectedOffset = circumference * (1 - selected / 100);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-h4 font-heading text-slate-900">타깃 연령</h4>
        <div className="text-right">
          <p className="text-caption text-slate-400">적합도</p>
          <p className="text-h4 font-heading text-slate-900">{percentage}%</p>
        </div>
      </div>
      <p className="text-caption text-slate-400">연령대별 매출 비중</p>

      {/* 도넛 차트 */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            {/* 배경 원 (나머지) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="10"
            />
            {/* 선택한 연령대 (하이라이트) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={selectedOffset}
              strokeLinecap="round"
              className={`transition-all duration-700 ${chartColorClass}`}
            />
          </svg>

          {/* 중앙 라벨 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-h3 font-heading ${chartColorClass.replace('stroke-', 'text-')}`}
            >
              {selected.toFixed(1)}%
            </span>
            <span className="text-caption text-slate-400">{userLabel}</span>
          </div>
        </div>

        {/* 범례 (차트 아래) */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${chartColorClass.replace('stroke-', 'bg-')}`}
            />
            <span className="text-slate-600">{userLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-200 rounded-full" />
            <span className="text-slate-400">나머지</span>
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-caption text-slate-400">사장님 선택</p>
        <p className="text-h4 font-bold text-slate-900">{userLabel} 타깃</p>
      </div>
    </div>
  );
}
