'use client';

const CAPITAL_OPTIONS = [
  { value: '10M', label: '1천만원 미만' },
  { value: '30M', label: '1천만원 ~ 3천만원' },
  { value: '50M', label: '3천만원 ~ 5천만원' },
  { value: '100M', label: '5천만원 ~ 1억원' },
  { value: '200M', label: '1억원 ~ 2억원' },
  { value: '200M+', label: '2억원 이상' },
] as const;

interface OnboardingStepCapitalProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingStepCapital({
  value,
  onChange,
}: OnboardingStepCapitalProps) {
  return (
    <div className="space-y-[4vh]">
      <h1 className="text-[clamp(1.875rem,4vw,2.5rem)] font-bold text-gray-900">
        준비된 창업 자본금을 알려주세요
      </h1>

      <div className="space-y-[1.5vh]">
        {CAPITAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(value === option.value ? '' : option.value)}
            className={`w-full px-[3%] py-[2%] border-2 rounded-2xl text-left transition-all hover:border-gray-900 hover:shadow-lg ${
              value === option.value
                ? 'border-gray-900 bg-gray-50 shadow-lg'
                : 'border-gray-300'
            } ${value && value !== option.value ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
          >
            <div className="text-[clamp(1.125rem,2vw,1.25rem)] font-bold text-gray-900">
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
