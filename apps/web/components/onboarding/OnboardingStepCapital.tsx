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
      <h1 className="text-display font-bold text-foreground">
        준비된 창업 자본금을 알려주세요
      </h1>

      <div className="space-y-[1.5vh]">
        {CAPITAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(value === option.value ? '' : option.value)}
            className={`w-full px-6 py-5 border-2 rounded-2xl text-left transition-all hover:border-primary hover:shadow-lg ${
              value === option.value
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border'
            } ${value && value !== option.value ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
          >
            <div className="text-h4 font-bold text-foreground">
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
