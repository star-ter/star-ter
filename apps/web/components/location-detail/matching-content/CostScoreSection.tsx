'use client';

import { ScoreWithExplanation } from './types';
import { formatMoney, CAPITAL_VALUES } from './constants';

interface CostScoreSectionProps {
  score: ScoreWithExplanation;
  userCapital: string;
  actualDeposit: number;
  actualRent: number;
}

export function CostScoreSection({
  score,
  userCapital,
  actualDeposit,
  actualRent,
}: CostScoreSectionProps) {
  // const { text: _text } = getScoreColor(score.score);
  const percentage = Math.round(score.score * 100);

  // 사용자 예산 (숫자로 변환)
  const userBudget = CAPITAL_VALUES[userCapital] || 30000000;

  // 예상 초기 비용 (보증금 + 권리금 등, 월세 12개월 포함 추정)
  const estimatedCost = actualDeposit + actualRent * 12;

  // 그래프용 최대값
  const maxValue = Math.max(userBudget, estimatedCost);

  // 막대 높이 계산 (%)
  const userBarHeight = (userBudget / maxValue) * 100;
  const costBarHeight = (estimatedCost / maxValue) * 100;

  // 예산 초과 여부
  const isOverBudget = estimatedCost > userBudget;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-h4 font-heading text-slate-900">창업 비용</h4>
        <div className="text-right">
          <p className="text-caption text-slate-400">적합도</p>
          <p className="text-h4 font-heading text-slate-900">{percentage}%</p>
        </div>
      </div>
      <p className="text-caption text-slate-400 mb-6">
        예산 대비 예상 비용 비교
      </p>

      {/* 막대 그래프 비교 */}
      <div className="flex justify-center gap-12 mb-6">
        {/* 사장님 예산 */}
        <div className="flex flex-col items-center">
          <span
            className={`text-body font-strong mb-2 ${userBudget >= estimatedCost ? 'text-info' : 'text-primary'}`}
          >
            {formatMoney(userBudget)}
          </span>
          <div className="w-20 h-40 bg-slate-100 rounded-lg relative overflow-hidden">
            <div
              className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ${
                userBudget >= estimatedCost ? 'bg-info' : 'bg-primary'
              }`}
              style={{ height: `${userBarHeight}%` }}
            />
          </div>
          <p className="text-body font-strong text-slate-600 mt-2">
            사장님 예산
          </p>
          <p className="text-caption text-slate-400 invisible">placeholder</p>
        </div>

        {/* 예상 비용 */}
        <div className="flex flex-col items-center">
          <span
            className={`text-body font-strong mb-2 ${estimatedCost > userBudget ? 'text-info' : 'text-primary'}`}
          >
            {formatMoney(estimatedCost)}
          </span>
          <div className="w-20 h-40 bg-slate-100 rounded-lg relative overflow-hidden">
            <div
              className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ${
                estimatedCost > userBudget ? 'bg-info' : 'bg-primary'
              }`}
              style={{ height: `${costBarHeight}%` }}
            />
          </div>
          <p className="text-body font-strong text-slate-600 mt-2">예상 비용</p>
          <p className="text-caption text-slate-400">보증금+월세1년</p>
        </div>
      </div>

      {/* 하단 상세 정보 */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between text-caption mb-1">
          <span className="text-slate-500">상권 평균 보증금</span>
          <span className="font-strong text-slate-700">
            {formatMoney(actualDeposit)}
          </span>
        </div>
        <div className="flex justify-between text-caption">
          <span className="text-slate-500">상권 평균 월세</span>
          <span className="font-strong text-slate-700">
            {formatMoney(actualRent)}
          </span>
        </div>
        {isOverBudget && (
          <p className="text-caption text-danger mt-2">
            예산 {formatMoney(estimatedCost - userBudget)} 초과
          </p>
        )}
      </div>
    </div>
  );
}
