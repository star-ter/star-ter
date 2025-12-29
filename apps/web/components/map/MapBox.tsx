import { useState, useEffect } from 'react';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';
import RankNav from '../rank-nav/RankNav';
import { usePopulationVisual } from '../../hooks/usePopulationVisual';
import { IndustryCategory } from '../../types/bottom-menu-types';
import SearchBox from '../search/SearchBox';
import { useMapStore } from '../../stores/useMapStore';

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
  const { center, zoom } = useMapStore();
  const [isRankOpen, setIsRankOpen] = useState(true);
  const [currentGuCode, setCurrentGuCode] = useState<string | null>(null);

  useEffect(() => {
    if (zoom <= 7 && zoom >= 5 && center) {
      const fetchGuCode = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/geo/gu?lat=${center.lat}&lng=${center.lng}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.signguCode) {
              setCurrentGuCode(data.signguCode);
            }
          }
        } catch (error) {
          console.error('Failed to fetch Gu code:', error);
        }
      };
      fetchGuCode();
    }
  }, [center, zoom]);

  const shouldShowRank = zoom >= 5;
  const rankLevel = zoom >= 7 ? 'gu' : 'dong';

  return (
    <section className="h-full pointer-events-none">
      <div className="absolute left-4 top-4 flex flex-col items-start gap-3 pointer-events-auto">
        <SearchBox />
        {shouldShowRank && (
          <>
            {/* 버튼은 클릭되어야 하므로 pointer-events-auto 추가 */}
            <button
              type="button"
              onClick={() => setIsRankOpen((prev) => !prev)}
              className="ml-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-white pointer-events-auto"
            >
              {isRankOpen ? '순위 닫기' : '순위 열기'}
            </button>

            {/* RankNav는 내부에서 clickable 요소가 있으므로 RankNav 컴포넌트에 pointer-events-auto가 있어야 함 (RankNav.tsx에서 처리됨) */}
            {isRankOpen && (
              <RankNav
                level={rankLevel}
                parentGuCode={
                  rankLevel === 'dong' ? currentGuCode || undefined : undefined
                }
              />
            )}
          </>
        )}
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto">
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
