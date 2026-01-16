'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';

import { Button } from './ui/button';
import {
  AGE_OPTIONS,
  REGION_OPTIONS,
  OPERATING_TIME_OPTIONS,
  CAPITAL_OPTIONS,
  type OnboardingData,
} from './onboarding/onboarding-options';
import {
  INDUSTRY_OPTIONS,
  INDUSTRY_MAPPING,
  MACRO_CATEGORIES,
  type MacroCategoryCode,
} from '@/services/location/industry-selection';

const DEFAULT_MACRO = Object.keys(MACRO_CATEGORIES)[0] as MacroCategoryCode;

type StartupPreferencesPopupProps = {
  initialData?: OnboardingData;
  onClose: () => void;
  onSave: (data: OnboardingData) => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
};

export function StartupPreferencesPopup({
  initialData,
  onClose,
  onSave,
  isSaving,
  isLoading,
  error,
}: StartupPreferencesPopupProps) {
  const [data, setData] = useState<OnboardingData>({
    age: '',
    region: '',
    operatingTime: '',
    capital: '',
    industryCode: null,
  });
  const [selectedMacro, setSelectedMacro] =
    useState<MacroCategoryCode>(DEFAULT_MACRO);

  useEffect(() => {
    if (initialData) {
      setData({
        ...initialData,
        industryCode: initialData.industryCode ?? null,
      });
      const macroFromIndustry = initialData.industryCode
        ? INDUSTRY_MAPPING[initialData.industryCode]
        : null;
      setSelectedMacro(macroFromIndustry ?? DEFAULT_MACRO);
    }
  }, [initialData]);

  const selectedMacroName = MACRO_CATEGORIES[selectedMacro];
  const selectedIndustries = useMemo(
    () =>
      INDUSTRY_OPTIONS.filter((industry) => industry.macro === selectedMacro),
    [selectedMacro],
  );

  const isValid = useMemo(
    () => !!data.age && !!data.region && !!data.operatingTime && !!data.capital,
    [data],
  );

  const handleSave = async () => {
    if (!isValid) return;
    await onSave(data);
  };

  return (
    <>
      <motion.div
        key="preferences-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <motion.div
        key="preferences-popup"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="fixed inset-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:w-[min(720px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-gray-100"
      >
        <div className="px-6 py-5 border-b border-gray-100 sm:px-8 sm:py-6 shrink-0">
          <h2 className="text-h3 font-black text-slate-900">창업 조건 설정</h2>
          <p className="text-body text-slate-500 mt-1">
            온보딩에서 입력한 창업 조건을 다시 설정할 수 있습니다.
          </p>
          {isLoading && (
            <p className="text-caption text-slate-400 mt-2">불러오는 중...</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8 sm:max-h-[70vh] sm:px-8 sm:py-6">
          <section className="space-y-3">
            <h3 className="text-caption font-bold text-slate-500">나이</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {AGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setData((prev) => ({ ...prev, age: option.value }))
                  }
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    data.age === option.value
                      ? 'border-slate-900 bg-slate-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="text-body font-bold text-slate-900">
                    {option.label}
                  </div>
                  <div className="text-caption text-slate-500 mt-1">
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-caption font-bold text-slate-500">선호 지역</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {REGION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setData((prev) => ({ ...prev, region: option.value }))
                  }
                  className={`rounded-2xl border-2 p-4 text-center transition-all ${
                    data.region === option.value
                      ? 'border-slate-900 bg-slate-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <option.Icon className="w-6 h-6 text-slate-900" />
                  </div>
                  <div className="text-caption font-bold text-slate-900">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-caption font-bold text-slate-500">
              희망 운영 시간
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {OPERATING_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      operatingTime: option.value,
                    }))
                  }
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    data.operatingTime === option.value
                      ? 'border-slate-900 bg-slate-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <option.Icon className="w-6 h-6 text-slate-900" />
                    <div>
                      <div className="text-body font-bold text-slate-900">
                        {option.label}
                      </div>
                      <div className="text-caption text-slate-500">
                        {option.time}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-caption font-bold text-slate-500">
              창업 자본금
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {CAPITAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setData((prev) => ({ ...prev, capital: option.value }))
                  }
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    data.capital === option.value
                      ? 'border-slate-900 bg-slate-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="text-body font-bold text-slate-900">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-caption font-bold text-slate-500">업종</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(MACRO_CATEGORIES).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => {
                      const nextMacro = code as MacroCategoryCode;
                      setSelectedMacro(nextMacro);
                      const currentMacro = data.industryCode
                        ? INDUSTRY_MAPPING[data.industryCode]
                        : null;
                      if (currentMacro && currentMacro !== nextMacro) {
                        setData((prev) => ({ ...prev, industryCode: null }));
                      }
                    }}
                    className={`rounded-full border px-3 py-1.5 text-caption font-semibold transition-all ${
                      selectedMacro === code
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-tiny font-strong text-slate-500 mb-2">
                  {selectedMacroName} 소분류
                </div>
                <div className="relative">
                  <div className="grid h-48 content-start gap-2 overflow-y-auto pr-1 sm:h-56 sm:grid-cols-2">
                    {selectedIndustries.map((industry) => (
                      <button
                        key={industry.code}
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            industryCode:
                              prev.industryCode === industry.code
                                ? null
                                : industry.code,
                          }))
                        }
                        className={`rounded-xl border px-3 py-2 text-left text-caption font-strong transition-all ${
                          data.industryCode === industry.code
                            ? 'border-slate-900 bg-white text-slate-900 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {industry.name}
                      </button>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-linear-to-b from-slate-50/70 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-linear-to-t from-slate-50/70 to-transparent" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between sm:px-8 sm:py-5 shrink-0">
          {error ? (
            <p className="text-caption text-red-500">{error}</p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="px-6">
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || isSaving || isLoading}
              className="px-6"
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
