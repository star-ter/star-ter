'use client';
import { useState } from 'react';

import ModalCard from './modal/ModalCard';
import PillButton from './PillButton';

export default function BottomMenuBox() {
  const [active, setActive] = useState<
    'area' | 'population' | 'industry' | 'compare' | 'none'
  >('none');

  function modalClose() {
    setActive('none');
  }

  const items = [
    { label: '영역', value: 'area' },
    { label: '유동인구', value: 'population' },
    { label: '업종', value: 'industry' },
    { label: '비교', value: 'compare' },
    { label: '초기화', value: 'none' },
  ];

  return (
    <section className="flex flex-col items-center mb-[24px]">
      {active === 'none' ? (
        <></>
      ) : (
        <ModalCard active={active} onClose={modalClose} />
      )}
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
