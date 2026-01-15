'use client';

import { ScoreWithExplanation } from './types';
import { getScoreColor } from './constants';

interface IndustryScoreSectionProps {
  score: ScoreWithExplanation;
  industryName: string;
  competitorCount?: number;
}

// 경쟁 밀도 계산
const getDensityLevel = (count: number) => {
  if (count === 0)
    return {
      label: '없음',
      color: 'text-emerald-600',
      bgColor: 'bg-slate-50',
      status: '진입 최적',
    };
  if (count <= 3)
    return {
      label: '낮음',
      color: 'text-emerald-600',
      bgColor: 'bg-slate-50',
      status: '진입 유리',
    };
  if (count <= 7)
    return {
      label: '보통',
      color: 'text-amber-600',
      bgColor: 'bg-slate-50',
      status: '경쟁 예상',
    };
  if (count <= 15)
    return {
      label: '높음',
      color: 'text-orange-600',
      bgColor: 'bg-slate-50',
      status: '경쟁 치열',
    };
  return {
    label: '매우 높음',
    color: 'text-rose-600',
    bgColor: 'bg-slate-50',
    status: '레드오션',
  };
};

export function IndustryScoreSection({
  score,
  industryName,
  competitorCount = 0,
}: IndustryScoreSectionProps) {
  const { text } = getScoreColor(score.score);
  const percentage = Math.round(score.score * 100);
  const density = getDensityLevel(competitorCount);

  // 요약 메시지 생성
  const getSummaryMessage = () => {
    if (competitorCount === 0) {
      return `이 상권에 ${industryName} 업종이 없어 진입이 최적입니다!`;
    }
    if (competitorCount <= 3) {
      return `${industryName} 경쟁 업체가 적어 진입하기 좋은 상권입니다.`;
    }
    if (competitorCount <= 7) {
      return `${industryName} 업종이 어느 정도 있어 경쟁이 예상됩니다.`;
    }
    return `${industryName} 경쟁이 치열하니 차별화 전략이 필요합니다.`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-h4 font-heading text-slate-900">업종 적합도</h4>
        <div className="text-right">
          <p className="text-caption text-slate-400">적합도</p>
          <p className={`text-h4 font-heading ${text}`}>{percentage}%</p>
        </div>
      </div>

      {/* 선택 업종 */}
      <p className="text-caption text-slate-400 mb-8">선택 업종에 대한 분석</p>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4 mb-6 mt-8">
        {/* 경쟁 업체 수 */}
        <div
          className={`rounded-xl p-6 border border-slate-100 ${density.bgColor}`}
        >
          <p className="text-caption text-slate-500 mb-2">경쟁 업체</p>
          <p className={`text-h2 font-heading text-slate-900`}>
            {competitorCount}개
          </p>
          <p className={`text-caption mt-2 text-blue-600 font-medium`}>
            {density.status}
          </p>
        </div>

        {/* 경쟁 밀도 */}
        <div
          className={`rounded-xl p-6 border border-slate-100 ${density.bgColor}`}
        >
          <p className="text-caption text-slate-500 mb-2">점포 밀도</p>
          <p className={`text-h2 font-heading text-slate-900`}>
            {density.label}
          </p>
          <p className="text-caption text-blue-600 font-medium mt-2">
            동일 업종 기준
          </p>
        </div>
      </div>

      {/* 요약 메시지 */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-8">
        <p className="text-caption font-strong text-slate-600">
          <span className="font-strong text-slate-700">💡</span>
          {getSummaryMessage()}
        </p>
      </div>

      {/* 하단 정보 */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-caption text-slate-400">사장님 선택</p>
        <p className="text-h4 font-bold text-slate-900">{industryName}</p>
      </div>
    </div>
  );
}
