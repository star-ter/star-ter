'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { OnboardingStepAge } from './onboarding/OnboardingStepAge';
import { OnboardingStepRegion } from './onboarding/OnboardingStepRegion';
import { OnboardingStepOperatingTime } from './onboarding/OnboardingStepOperatingTime';
import { OnboardingStepCapital } from './onboarding/OnboardingStepCapital';
import { OnboardingStepIndustry } from './onboarding/OnboardingStepIndustry';
import {
  MACRO_CATEGORIES,
  type MacroCategoryCode,
} from '@/services/location/industry-selection';

export type OnboardingData = {
  age: string;
  region: string;
  operatingTime: string;
  capital: string;
  industryCode: string;
};

type OnboardingDraft = Omit<OnboardingData, 'industryCode'> & {
  industryCode?: string | null;
};

interface OnboardingPageProps {
  onComplete: (data: OnboardingData) => Promise<void> | void;
  onBack?: () => void;
  onSkip?: (data: OnboardingDraft) => Promise<void> | void;
}

export function OnboardingPage({
  onComplete,
  onBack,
  onSkip,
}: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    age: '',
    region: '',
    operatingTime: '',
    capital: '',
  });
  const defaultMacro = Object.keys(MACRO_CATEGORIES)[0] as MacroCategoryCode;
  const [selectedMacro, setSelectedMacro] =
    useState<MacroCategoryCode>(defaultMacro);
  const [selectedIndustryCode, setSelectedIndustryCode] = useState<
    string | null
  >(null);

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      if (!selectedIndustryCode) return;
      await onComplete({
        ...data,
        industryCode: selectedIndustryCode,
      });
    }
  };

  const handleSkip = async () => {
    if (!onSkip) return;
    await onSkip({
      ...data,
      industryCode: selectedIndustryCode ?? null,
    });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else if (onBack) onBack();
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!data.age;
      case 2:
        return !!data.region;
      case 3:
        return !!data.operatingTime;
      case 4:
        return !!data.capital;
      case 5:
        return !!selectedIndustryCode;
      default:
        return false;
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <header className="relative px-8 py-6 flex items-center justify-between shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">뒤로</span>
        </button>

        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="w-full mx-auto px-8 flex items-center justify-between max-w-300">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1 last:flex-none flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-bold transition-all duration-300 shrink-0 ${
                    s <= step
                      ? 'bg-[#2C2F6C] text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 5 && (
                  <div className="flex-1 h-0.5 bg-gray-200 overflow-hidden mx-2">
                    <div
                      className="h-full bg-[#2C2F6C] transition-all duration-500"
                      style={{
                        width: s < step ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="w-20"></div>
      </header>

      <div className="flex-1 flex flex-col px-[5%] pt-[5vh] pb-[5vh] overflow-y-auto">
        <div
          className={`w-full mx-auto ${step === 5 ? 'max-w-300' : 'max-w-250'}`}
        >
          {step === 1 && (
            <OnboardingStepAge
              value={data.age}
              onChange={(value) => setData({ ...data, age: value })}
            />
          )}

          {step === 2 && (
            <OnboardingStepRegion
              value={data.region}
              onChange={(value) => setData({ ...data, region: value })}
            />
          )}

          {step === 3 && (
            <OnboardingStepOperatingTime
              value={data.operatingTime}
              onChange={(value) => setData({ ...data, operatingTime: value })}
            />
          )}

          {step === 4 && (
            <OnboardingStepCapital
              value={data.capital}
              onChange={(value) => setData({ ...data, capital: value })}
            />
          )}

          {step === 5 && (
            <OnboardingStepIndustry
              selectedMacro={selectedMacro}
              onSelectMacro={setSelectedMacro}
              selectedIndustryCode={selectedIndustryCode}
              onSelectIndustryCode={setSelectedIndustryCode}
            />
          )}
        </div>
      </div>

      <div className="px-8 py-4 border-t shrink-0">
        <div
          className={`max-w-4xl mx-auto flex items-center ${
            step === 5 && onSkip ? 'justify-between' : 'justify-end'
          }`}
        >
          {step === 5 && onSkip && (
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-gray-500 hover:text-gray-900 text-lg font-medium"
            >
              건너뛰기
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="bg-gray-900 hover:bg-gray-800 text-white px-12 py-7 rounded-lg text-lg font-medium disabled:bg-gray-300"
          >
            {step === 5 ? '완료' : '다음'}
          </Button>
        </div>
      </div>
    </div>
  );
}
