'use client';
import { useState } from 'react';

import ModalCard from './modal/ModalCard';

export default function BottomMenuBox() {
  const [active, setActive] = useState<
    'area' | 'population' | 'industry' | 'compare' | 'none'
  >('none');

  function modalClose() {
    setActive('none');
  }

  return (
    <section className="flex flex-col items-center mb-[24px]">
      {active === 'none' ? (
        <></>
      ) : (
        <ModalCard active={active} onClose={modalClose} />
      )}
      <div className="flex items-center justify-center gap-4 rounded-2xl bg-white/80 px-4 py-3 shadow-md ring-1 ring-black/5">
        <button
          className="rounded-full bg-white/90 px-4 py-2 text-sm text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100"
          type="submit"
          onClick={() => setActive('area')}
        >
          영역
        </button>
        <button
          className="rounded-full bg-white/90 px-4 py-2 text-sm text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100"
          type="submit"
          onClick={() => setActive('population')}
        >
          유동인구
        </button>
        <button
          className="rounded-full bg-white/90 px-4 py-2 text-sm text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100"
          type="submit"
          onClick={() => setActive('industry')}
        >
          업종
        </button>
        <button
          className="rounded-full bg-white/90 px-4 py-2 text-sm text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100"
          type="submit"
          onClick={() => setActive('compare')}
        >
          비교
        </button>
        <button
          className="rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-sm transition hover:bg-gray-800"
          type="submit"
          onClick={() => setActive('none')}
        >
          초기화
        </button>
      </div>
    </section>
  );
}
