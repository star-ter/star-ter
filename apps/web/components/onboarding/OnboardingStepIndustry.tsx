'use client';

import type { MacroCategoryCode } from '@/services/location/industry-selection';
import { IndustrySelectSection } from '../IndustrySelectSection';

interface OnboardingStepIndustryProps {
  selectedMacro: MacroCategoryCode;
  onSelectMacro: (macro: MacroCategoryCode) => void;
  selectedIndustryCode: string | null;
  onSelectIndustryCode: (industryCode: string | null) => void;
}

export function OnboardingStepIndustry({
  selectedMacro,
  onSelectMacro,
  selectedIndustryCode,
  onSelectIndustryCode,
}: OnboardingStepIndustryProps) {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          어떤 업종을 고려하고 계신가요?
        </h1>
        <p className="text-gray-500 text-lg">
          대분류를 선택한 뒤 소분류를 골라주세요
        </p>
      </div>

      <IndustrySelectSection
        selectedMacro={selectedMacro}
        onSelectMacro={onSelectMacro}
        selectedIndustryCode={selectedIndustryCode}
        onSelectIndustryCode={onSelectIndustryCode}
      />
    </div>
  );
}
