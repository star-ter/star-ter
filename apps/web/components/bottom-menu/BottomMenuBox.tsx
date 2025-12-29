'use client';
import { ReactElement, useState } from 'react';

import ModalCard from './modal/ModalCard';
import PillButton from './PillButton';
// import AreaContents from './modal/AreaContents';
import PopulationContents from './modal/PopulationContents';
import IndustryContents from './modal/IndustryContents';
import CompareContents from './modal/CompareContents';
import {
  IndustryCategory,
  CompareRequest,
} from '../../types/bottom-menu-types';
import { IndustryData } from '../../mocks/industry';
import { useSidebarStore } from '../../stores/useSidebarStore';

type ActiveType = /* 'area' | */ 'population' | 'industry' | 'compare';

import { usePopulationVisual } from '../../hooks/usePopulationVisual';
interface BottomMenuProps {
  locationA: { name: string; code?: string };
  locationB: { name: string; code?: string };
  setLocationA: (area: { name: string; code?: string }) => void;
  setLocationB: (area: { name: string; code?: string }) => void;
  handlePickMode: (target: 'A' | 'B') => void;
  population: ReturnType<typeof usePopulationVisual>;
  onCompare?: (data?: CompareRequest) => void;
  onSelectCategory: (category: IndustryCategory | null) => void;
}

export default function BottomMenuBox({
  locationA = { name: '' },
  locationB = { name: '' },
  setLocationA,
  setLocationB,
  handlePickMode,
  population,
  onCompare,
  onSelectCategory,
}: BottomMenuProps) {
  const [active, setActive] = useState<ActiveType | 'none'>('none');
  const { setInfoBarOpen, setIsOpen } = useSidebarStore();

  function modalClose() {
    setActive('none');
  }

  function handleIndustry(id: string) {
    console.log('대분류 업종 코드 :', id);

    const selected = IndustryData.find((item) => item.code === id);
    if (selected) {
      onSelectCategory(selected);
    }
    // TODO: 선택된 업종에 대한 데이터 가져오기
    modalClose();
  }

  function handleCompare(data: CompareRequest) {
    console.log('비교 요청:', data);
    // TODO: 비교 로직 실행
    if (onCompare) {
      onCompare(data);
    }
    modalClose();
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
    // { label: '영역', value: 'area' },
    { label: '유동인구', value: 'population' },
    { label: '업종', value: 'industry' },
    { label: '비교', value: 'compare' },
    { label: '초기화', value: 'none' },
  ];

  const contents: Record<ActiveType, ReactElement> = {
    // population: <AreaContents onClose={modalClose} />,
    population: (
      <PopulationContents
        onClose={modalClose}
        onView={handlePopulation}
        population={population}
      />
    ),
    industry: (
      <IndustryContents
        onClose={modalClose}
        categories={IndustryData}
        onSelect={handleIndustry}
        isLoading={false}
      />
    ),
    compare: (
      <CompareContents
        onClose={modalClose}
        onCompare={handleCompare}
        targetA={locationA.name}
        targetB={locationB.name}
        propCodeA={locationA.code}
        propCodeB={locationB.code}
        changeTargetA={(val) => setLocationA({ name: val })}
        changeTargetB={(val) => setLocationB({ name: val })}
        onPickLocation={handlePickLocation}
      />
    ),
  };

  const Content = active === 'none' ? null : contents[active as ActiveType];

  return (
    <section className="w-full flex flex-col items-center mb-[24px]">
      {Content && <ModalCard>{Content}</ModalCard>}
      <div className="flex items-center justify-center gap-4 rounded-2xl bg-white/80 px-4 py-3 shadow-md ring-1 ring-black/5">
        {items.map(({ label, value }) => (
          <PillButton
            key={value}
            label={label}
            onClick={() => {
              // 초기화 버튼 처리 (항상 실행되어야 함)
              if (value === 'none') {
                setActive('none');
                setLocationA({ name: '' });
                setLocationB({ name: '' });
                onSelectCategory(null);
                population.setShowLayer(false);
                return;
              }

              // 이미 열려있는 메뉴를 다시 클릭하면 닫기
              if (active === value) {
                modalClose();
                return;
              }

              setActive(value);
              // 초기화 외의 버튼을 눌러도 위치 정보는 리셋 (기타 기획 의도 유지)
              setLocationA({ name: '' });
              setLocationB({ name: '' });

              if (value === 'compare') {
                setInfoBarOpen(false); // 비교 모드 선택 시 왼쪽 사이드바만 닫기
                setIsOpen(false);
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}
