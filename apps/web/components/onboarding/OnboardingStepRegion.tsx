'use client';

import {
  Building2,
  Home,
  ShoppingBag,
  GraduationCap,
  Train,
  Map,
} from 'lucide-react';

const REGION_OPTIONS = [
  { value: 'office', label: '오피스 밀집', Icon: Building2 },
  { value: 'residential', label: '주거 밀집', Icon: Home },
  { value: 'commercial', label: '상업 지역', Icon: ShoppingBag },
  { value: 'university', label: '대학가', Icon: GraduationCap },
  { value: 'station', label: '역세권', Icon: Train },
  { value: 'tourist', label: '관광지', Icon: Map },
] as const;

interface OnboardingStepRegionProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingStepRegion({
  value,
  onChange,
}: OnboardingStepRegionProps) {
  return (
    <div className="space-y-[4vh]">
      <h1 className="text-display font-bold text-foreground">
        선호하는 지역 특징을 선택하세요
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-[2vw]">
        {REGION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(value === option.value ? '' : option.value)}
            className={`p-[15%] border-2 rounded-2xl text-center transition-all hover:border-primary hover:shadow-lg ${
              value === option.value
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border'
            } ${value && value !== option.value ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
          >
            <div className="flex justify-center mb-[1.5vh]">
              <option.Icon size={40} className="w-12 h-12 text-foreground" />
            </div>
            <div className="text-h5 font-bold text-foreground">
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
