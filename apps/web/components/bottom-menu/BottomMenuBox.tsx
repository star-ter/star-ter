'use client';
import { ReactElement, useState } from 'react';

import ModalCard from './modal/ModalCard';
import PillButton from './PillButton';
import AreaContents from './modal/AreaContents';
import PopulationContents from './modal/PopulationContents';
import IndustryContents from './modal/IndustryContents';
import CompareContents from './modal/CompareContents';

type ActiveType = 'area' | 'population' | 'industry' | 'compare';

export default function BottomMenuBox() {
  const [active, setActive] = useState<ActiveType | 'none'>('none');

  function modalClose() {
    setActive('none');
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
    population: <PopulationContents onClose={modalClose} />,
    industry: <IndustryContents onClose={modalClose} />,
    compare: <CompareContents onClose={modalClose} />,
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
            onClick={() => setActive(value)}
          />
        ))}
      </div>
    </section>
  );
}
