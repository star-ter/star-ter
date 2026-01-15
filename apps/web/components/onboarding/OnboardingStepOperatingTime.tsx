'use client';

import { Sunrise, Sun, Sunset, Moon, Clock } from 'lucide-react';

const OPERATING_TIME_OPTIONS = [
  { value: 'morning', label: '오전', time: '06:00 - 12:00', Icon: Sunrise },
  { value: 'afternoon', label: '오후', time: '12:00 - 18:00', Icon: Sun },
  { value: 'evening', label: '저녁', time: '18:00 - 24:00', Icon: Sunset },
  { value: 'night', label: '야간', time: '24:00 - 06:00', Icon: Moon },
  { value: 'allday', label: '종일', time: '06:00 - 24:00', Icon: Clock },
] as const;

interface OnboardingStepOperatingTimeProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingStepOperatingTime({
  value,
  onChange,
}: OnboardingStepOperatingTimeProps) {
  return (
    <div className="space-y-[4vh]">
      <h1 className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold text-gray-900">
        희망 운영 시간대를 선택하세요
      </h1>

      <div className="space-y-[1.5vh]">
        {OPERATING_TIME_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(value === option.value ? '' : option.value)}
            className={`w-full px-[3%] py-[2%] border-2 rounded-2xl text-left transition-all hover:border-gray-900 hover:shadow-lg ${
              value === option.value
                ? 'border-gray-900 bg-gray-50 shadow-lg'
                : 'border-gray-300'
            } ${value && value !== option.value ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[3vw]">
                <option.Icon size={36} className="text-gray-900" />
                <div>
                  <div className="text-[clamp(1.125rem,2vw,1.25rem)] font-bold text-gray-900 mb-[0.5vh]">
                    {option.label}
                  </div>
                  <div className="text-[clamp(0.875rem,1.5vw,1rem)] text-gray-500">
                    {option.time}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
