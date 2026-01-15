'use client';

import { TimeScoreData } from './types';
import { getScoreColor } from './constants';

interface TimeScoreSectionProps {
  score: TimeScoreData;
  userOperatingTime: string;
}

// 시간대 정보
const TIME_SLOTS = [
  { key: 'morning', label: '오전', range: '06 ~ 12' },
  { key: 'afternoon', label: '오후', range: '12 ~ 18' },
  { key: 'evening', label: '저녁', range: '18 ~ 24' },
  { key: 'night', label: '야간', range: '00 ~ 06' },
] as const;

const TIME_LABEL_MAP: Record<string, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
  night: '야간',
  allday: '종일',
};

export function TimeScoreSection({
  score,
  userOperatingTime,
}: TimeScoreSectionProps) {
  const { text } = getScoreColor(score.score);
  const percentage = Math.round(score.score * 100);
  const { breakdown, selectedTime } = score;

  // 그래프 최대값 계산 (비율 조정용)
  const maxValue = Math.max(
    breakdown.morning,
    breakdown.afternoon,
    breakdown.evening,
    breakdown.night,
    10, // 최소 10%로 스케일
  );

  // 선택된 시간대 확인 (allday면 전체 하이라이트)
  const isSelected = (key: string) => {
    if (selectedTime === 'allday') return true;
    return key === selectedTime;
  };

  // 선택된 시간대 라벨
  const selectedLabel = TIME_LABEL_MAP[selectedTime] || selectedTime;

  // 선택된 시간대 범위
  const selectedSlot = TIME_SLOTS.find((s) => s.key === selectedTime);
  const selectedRange = selectedSlot
    ? `${selectedSlot.range.split(' ~ ')[0]}:00 - ${selectedSlot.range.split(' ~ ')[1]}:00`
    : '종일';

  // 선택된 시간대 비중
  const selectedRatio =
    selectedTime === 'allday'
      ? 100
      : breakdown[selectedTime as keyof typeof breakdown] || 0;

  // userOperatingTime lint 방지
  void userOperatingTime;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-h4 font-heading text-slate-900">운영 시간</h4>
        </div>
        <div className="text-right">
          <p className="text-caption text-slate-400">적합도</p>
          <p className={`text-h4 font-heading ${text}`}>{percentage}%</p>
        </div>
      </div>
      <p className="text-caption text-slate-400 mb-6">시간대별 매출 추이</p>

      {/* 막대 그래프 */}
      <div className="flex items-end justify-between gap-4 mb-6">
        {TIME_SLOTS.map((slot) => {
          const value = breakdown[slot.key as keyof typeof breakdown];
          const barHeight = Math.max((value / maxValue) * 100, 5);
          const selected = isSelected(slot.key);

          return (
            <div key={slot.key} className="flex-1 flex flex-col items-center">
              {/* 값 표시 */}
              <span
                className={`text-body font-strong mb-2 ${selected ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                {value.toFixed(1)}%
              </span>

              {/* 막대 컨테이너 - 고정 높이 */}
              <div className="w-26 h-80 rounded-lg relative overflow-hidden">
                {/* 막대 (아래에서 위로) */}
                <div
                  className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ${
                    selected ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>

              {/* 라벨 */}
              <div className="text-center mt-3">
                <p
                  className={`text-body font-strong ${selected ? 'text-emerald-600' : 'text-slate-600'}`}
                >
                  {slot.label}
                </p>
                <p className="text-caption text-slate-400">{slot.range}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 정보 */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          <p className="text-caption text-slate-400">사장님 선택 운영 시간</p>
          <p className="text-h4 font-bold text-slate-900">
            {selectedRange} ({selectedLabel})
          </p>
        </div>
        <div className="text-right">
          <p className="text-caption text-slate-400">선택 시간대 매출 비중</p>
          <p className={`text-h4 font-bold ${text}`}>
            {selectedRatio.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
