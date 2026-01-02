import { useState } from 'react';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';
import RankNav from '../rank-nav/RankNav';
import { usePopulationVisual } from '../../hooks/usePopulationVisual';
import { IndustryCategory, ReportRequest } from '../../types/bottom-menu-types';
import SearchBox from '../search/SearchBox';
import LocationNav from '../left-top/LocationNav';
import { useMapStore } from '../../stores/useMapStore';
import { useMapSync } from '@/hooks/useMapSync';

interface MapOverlayProps {
  locationA: { name: string; code?: string };
  locationB: { name: string; code?: string };
  setLocationA: (area: { name: string; code?: string }) => void;
  setLocationB: (area: { name: string; code?: string }) => void;
  handlePickMode: (target: 'A' | 'B') => void;
  population: ReturnType<typeof usePopulationVisual>;
  onCompare?: () => void;
  onSelectCategory: (category: IndustryCategory | null) => void;
  onCreateReport?: (data: ReportRequest) => void;
  isReportOpen?: boolean;
  onToggleReport?: (isOpen: boolean) => void;
}

export default function MapOverlay({
  locationA,
  locationB,
  setLocationA,
  setLocationB,
  handlePickMode,
  population,
  onCompare,
  onSelectCategory,
  onCreateReport,
  isReportOpen,
  onToggleReport,
}: MapOverlayProps) {
  const { zoom } = useMapStore();
  const [isRankOpen, setIsRankOpen] = useState(true);
  const { currentGuCode, currentGuName } = useMapSync();

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
          onCreateReport={onCreateReport}
          isReportOpen={isReportOpen}
          onToggleReport={onToggleReport}
        />
      </div>
    </section>
  );
}
