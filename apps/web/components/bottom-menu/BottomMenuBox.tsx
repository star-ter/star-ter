'use client';
import { ReactElement, useState } from 'react';

import ModalCard from './modal/ModalCard';
import PillButton from './PillButton';
import AreaContents from './modal/AreaContents';
import PopulationContents from './modal/PopulationContents';
import IndustryContents from './modal/IndustryContents';
import CompareContents from './modal/CompareContents';
import {
  IndustryCategory,
  CompareRequest,
} from '../../types/bottom-menu-types';

type ActiveType = 'area' | 'population' | 'industry' | 'compare';

const MockIndustryCategory: IndustryCategory[] = [
  { id: 'food', label: '음식', iconCode: 'food' },
  { id: 'retail', label: '소매', iconCode: 'retail' },
  { id: 'service', label: '서비스', iconCode: 'service' },
  { id: 'game', label: '오락', iconCode: 'game' },
  { id: 'education', label: '교육', iconCode: 'education' },
  { id: 'hotel', label: '숙박', iconCode: 'hotel' },
];

interface BottomMenuProps {
  locationA: string;
  locationB: string;
  setLocationA: (area: string) => void;
  setLocationB: (area: string) => void;
  handlePickMode: (target: 'A' | 'B') => void;
}

export default function BottomMenuBox({
  locationA = '',
  locationB = '',
  setLocationA,
  setLocationB,
  handlePickMode,
}: BottomMenuProps) {
  const [active, setActive] = useState<ActiveType | 'none'>('none');

  function modalClose() {
    setActive('none');
  }

  function handleIndustry(id: string) {
    console.log('업종 선택:', id);
    // TODO: 선택된 업종에 대한 데이터 가져오기
    modalClose();
  }

  function handleCompare(data: CompareRequest) {
    console.log('비교 요청:', data);
    // TODO: 비교 로직 실행
  }

  function handlePopulation() {
    console.log('유동인구 보기');
    // TODO: 유동인구 레이어 토글
  }

  function handlePickLocation(target: 'A' | 'B') {
    console.log(`${target}를 선택`);
    // TODO: 지도 선택 모드 활성화

    if (handlePickMode) {
      handlePickMode(target);
    }
  }

  const items: { label: string; value: ActiveType | 'none' }[] = [
    { label: '영역', value: 'area' },
    { label: '유동인구', value: 'population' },
    { label: '업종', value: 'industry' },
    { label: '비교', value: 'compare' },
    { label: '초기화', value: 'none' },
  ];

  const contents: Record<ActiveType, ReactElement> = {
    area: <AreaContents onClose={modalClose} />,
    population: (
      <PopulationContents onClose={modalClose} onView={handlePopulation} />
    ),
    industry: (
      <IndustryContents
        onClose={modalClose}
        categories={MockIndustryCategory}
        onSelect={handleIndustry}
      />
    ),
    compare: (
      <CompareContents
        onClose={modalClose}
        onCompare={handleCompare}
        targetA={locationA}
        targetB={locationB}
        changeTargetA={setLocationA}
        changeTargetB={setLocationB}
        onPickLocation={handlePickLocation}
      />
    ),
  };

  const Content = active === 'none' ? null : contents[active as ActiveType];

  return (
    <section className="flex flex-col items-center mb-[24px]">
      {Content && <ModalCard>{Content}</ModalCard>}
      <div className="flex items-center justify-center gap-4 rounded-2xl bg-white/80 px-4 py-3 shadow-md ring-1 ring-black/5">
        {items.map(({ label, value }) => (
          <PillButton
            key={value}
            label={label}
            onClick={() => {
              setActive(value);
              setLocationA('');
              setLocationB('');
            }}
          />
        ))}
      </div>
    </section>
  );
}
