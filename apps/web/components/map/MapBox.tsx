import { useState, useEffect } from 'react';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';
import RankNav from '../rank-nav/RankNav';
import { usePopulationVisual } from '../../hooks/usePopulationVisual';
import { IndustryCategory } from '../../types/bottom-menu-types';
import SearchBox from '../search/SearchBox';
import LocationNav from '../left-top/LocationNav';
import { useMapStore } from '../../stores/useMapStore';

interface MapBoxProps {
  locationA: { name: string; code?: string };
  locationB: { name: string; code?: string };
  setLocationA: (area: { name: string; code?: string }) => void;
  setLocationB: (area: { name: string; code?: string }) => void;
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
  const { center, zoom, isMapIdle } = useMapStore();
  const [isRankOpen, setIsRankOpen] = useState(true);
  const [currentGuCode, setCurrentGuCode] = useState<string | null>(null);
  const [currentGuName, setCurrentGuName] = useState<string | null>(null);

  useEffect(() => {
    // isMapIdle이 true일 때만 데이터 fetch
    // zoom이 낮을수록(1레벨) 상세 지도이므로, 동 레벨 순위를 보여주기 위해 줌이 작을 때도 fetch해야 함.
    if (zoom <= 8 && center && isMapIdle) {
      const fetchGuCode = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/geo/gu?lat=${center.lat}&lng=${center.lng}`,
          );
          if (res.ok) {
            const text = await res.text();
            if (!text) return;
            const data = JSON.parse(text);
            if (data?.signguCode) {
              setCurrentGuCode(data.signguCode);
              setCurrentGuName(data.signguName);
            }
          }
        } catch (error) {
          console.error('Failed to fetch Gu code:', error);
        }
      };
      fetchGuCode();
    }
  }, [center, zoom, isMapIdle]);

  const shouldShowRank = zoom >= 5;
  const rankLevel = zoom >= 7 ? 'gu' : 'dong';

  return (
    <section className="absolute w-fit h-fit pointer-events-none">
      <div className="flex flex-col items-start gap-3 pointer-events-none">
        <div className="inline-flex items-center pointer-events-auto">
          <SearchBox />
          <LocationNav />
        </div>
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
                parentGuName={
                  rankLevel === 'dong' ? currentGuName || undefined : undefined
                }
              />
            )}
          </>
        )}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto">
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
