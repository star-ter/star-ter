'use client';

const AGE_OPTIONS = [
  { value: '20s', label: '20대', desc: '젊은 층을 위한 트렌디한 업종' },
  { value: '30s', label: '30대', desc: '안정적인 수익 창출이 가능한 업종' },
  { value: '40s', label: '40대', desc: '경험을 활용할 수 있는 업종' },
  { value: '50s', label: '50대', desc: '노하우 기반의 전문 업종' },
  { value: '60s', label: '60대 이상', desc: '여유로운 운영이 가능한 업종' },
] as const;

interface OnboardingStepAgeProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingStepAge({ value, onChange }: OnboardingStepAgeProps) {
  return (
    <div className="space-y-[4vh]">
      <h1 className="text-display font-bold text-gray-900">
        타겟 연령층을 알려주세요
      </h1>

      <div className="space-y-[1.5vh]">
        {AGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(value === option.value ? '' : option.value)}
            className={`w-full px-6 py-4 border-2 rounded-2xl text-left transition-all hover:border-gray-900 hover:shadow-lg ${
              value === option.value
                ? 'border-gray-900 bg-gray-50 shadow-lg'
                : 'border-gray-300'
            } ${value && value !== option.value ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-h4 font-bold text-gray-900 mb-[0.5vh]">
                  {option.label}
                </div>
                <div className="text-body text-gray-500">{option.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
