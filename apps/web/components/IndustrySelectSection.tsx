'use client';

import { useMemo } from 'react';
import {
  INDUSTRY_OPTIONS,
  MACRO_CATEGORIES,
  type MacroCategoryCode,
} from '@/services/location/industry-selection';

const MACRO_OPTIONS = Object.entries(MACRO_CATEGORIES).map(([code, name]) => ({
  code: code as MacroCategoryCode,
  name,
}));

interface IndustrySelectSectionProps {
  selectedMacro: MacroCategoryCode;
  onSelectMacro: (macro: MacroCategoryCode) => void;
  selectedIndustryCode: string | null;
  onSelectIndustryCode: (industryCode: string | null) => void;
}

export function IndustrySelectSection({
  selectedMacro,
  onSelectMacro,
  selectedIndustryCode,
  onSelectIndustryCode,
}: IndustrySelectSectionProps) {
  const selectedMacroName = MACRO_CATEGORIES[selectedMacro];
  const selectedIndustries = useMemo(
    () =>
      INDUSTRY_OPTIONS.filter((industry) => industry.macro === selectedMacro),
    [selectedMacro],
  );

  return (
    <div className="grid gap-[3vw] lg:grid-cols-[clamp(200px,20vw,280px)_minmax(0,1fr)]">
      <div className="flex gap-[1vw] overflow-x-auto pb-[1vh] lg:flex-col lg:overflow-visible">
        {MACRO_OPTIONS.map((macro) => (
          <button
            key={macro.code}
            onClick={() => onSelectMacro(macro.code)}
            className={`min-w-35 whitespace-nowrap rounded-2xl border-2 px-[1.5vw] py-[1.2vh] text-h5 font-medium transition-all lg:w-full ${
              selectedMacro === macro.code
                ? 'border-gray-900 bg-gray-50 text-gray-900 shadow-lg'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:shadow-lg opacity-40 grayscale-[0.5]'
            }`}
          >
            {macro.name}
          </button>
        ))}
      </div>

      <section className="flex h-[440px] flex-col rounded-2xl border-2 border-gray-300 bg-white p-8">
        <div className="flex flex-wrap items-center justify-between gap-[1vw]">
          <div>
            <h2 className="text-h2 font-bold text-gray-900">
              {selectedMacroName} 소분류
            </h2>
            <p className="text-h4 text-gray-600">원하는 업종을 선택하세요</p>
          </div>
          <span className="text-body text-gray-500">
            {selectedIndustries.length}개
          </span>
        </div>

        <div className="relative mt-4 flex-1 min-h-0">
          <div className="grid h-full content-start items-start gap-5 overflow-y-auto pr-2 pb-6 pt-2 sm:grid-cols-2 xl:grid-cols-3">
            {selectedIndustries.map((industry) => (
              <button
                key={industry.code}
                onClick={() =>
                  onSelectIndustryCode(
                    selectedIndustryCode === industry.code
                      ? null
                      : industry.code,
                  )
                }
                className={`group rounded-2xl border-2 px-6 py-4 text-left transition-all hover:border-gray-900 hover:shadow-lg ${
                  selectedIndustryCode === industry.code
                    ? 'border-gray-900 bg-gray-50 shadow-lg'
                    : 'border-gray-300 bg-white'
                } ${selectedIndustryCode && selectedIndustryCode !== industry.code ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
              >
                <div className="text-h5 font-bold text-gray-900">
                  {industry.name}
                </div>
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-white to-transparent" />
        </div>
      </section>
    </div>
  );
}
