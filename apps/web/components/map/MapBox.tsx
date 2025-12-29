import { useState } from 'react';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';
import RankNav from '../rank-nav/RankNav';
import { usePopulationVisual } from '../../hooks/usePopulationVisual';
import { IndustryCategory } from '../../types/bottom-menu-types';
import SearchBox from '../search/SearchBox';

interface MapBoxProps {
  locationA: string;
  locationB: string;
  setLocationA: (area: string) => void;
  setLocationB: (area: string) => void;
  handlePickMode: (target: 'A' | 'B') => void;
  population: ReturnType<typeof usePopulationVisual>;
  onCompare?: () => void;
  onSelectCategory: (category: IndustryCategory | null) => void;
}

export default function MapBox({
  locationA,
  locationB,
  setLocationA,
  setLocationB,
  handlePickMode,
  population,
  onCompare,
  onSelectCategory,
}: MapBoxProps) {
  const [isRankOpen, setIsRankOpen] = useState(true);

  return (
    <section className="relative h-full w-full pointer-events-none">
      <div className="absolute left-4 top-4 flex flex-col items-start gap-3 pointer-events-auto">
        <SearchBox />
        <button
          type="button"
          onClick={() => setIsRankOpen((prev) => !prev)}
          className="ml-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-white"
        >
          {isRankOpen ? '순위 닫기' : '순위 열기'}
        </button>
        {isRankOpen && <RankNav />}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
        <BottomMenuBox
          locationA={locationA}
          locationB={locationB}
          setLocationA={setLocationA}
          setLocationB={setLocationB}
          handlePickMode={handlePickMode}
          population={population}
          onCompare={onCompare}
          onSelectCategory={onSelectCategory}
        />
      </div>
    </section>
  );
}
