import { useState } from 'react';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';
import RankNav from '../rank-nav/RankNav';
import { usePopulationVisual } from '../../hooks/usePopulationVisual';
import { IndustryCategory, ReportRequest } from '../../types/bottom-menu-types';
import { useMapStore } from '../../stores/useMapStore';
import { useLocationSync } from '@/hooks/useLocationSync';
import MapHeader from '../header/MapHeader';

interface MapOverlayProps {
  locationA: { name: string; code?: string };
  locationB: { name: string; code?: string };
  setLocationA: (area: { name: string; code?: string }) => void;
  setLocationB: (area: { name: string; code?: string }) => void;
  handlePickMode: (target: 'A' | 'B') => void;
  population: ReturnType<typeof usePopulationVisual>;
  onCompare?: () => void;
  onSelectCategory: (category: IndustryCategory | null) => void;
  selectedCategory: IndustryCategory | null;
  selectedSubCode: string | null;
  onSelectSubCode: (code: string | null) => void;
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
  selectedCategory,
  selectedSubCode,
  onSelectSubCode,
  onCreateReport,
  isReportOpen,
  onToggleReport,
}: MapOverlayProps) {
  const { zoom } = useMapStore();
  const [isRankOpen, setIsRankOpen] = useState(true);

  // Use LocationSync here to share state
  const locationSync = useLocationSync();
  const { selectedGu, guList } = locationSync;

  const shouldShowRank = zoom >= 5;
  const rankLevel = zoom >= 7 ? 'gu' : 'dong';

  const currentGuName = guList.find((g) => g.code === selectedGu)?.name;

  return (
    <>
      <MapHeader {...locationSync} />

      <section className="absolute w-fit h-fit pointer-events-none mt-20 ml-6">
        <div className="flex flex-col items-start gap-3 pointer-events-none">
          {shouldShowRank && !isReportOpen && (
            <>
              {/* 버튼은 클릭되어야 하므로 pointer-events-auto 추가 */}
              <button
                type="button"
                onClick={() => setIsRankOpen((prev) => !prev)}
                className="inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-white pointer-events-auto"
              >
                {isRankOpen ? '순위 닫기' : '순위 열기'}
              </button>

              {/* RankNav는 내부에서 clickable 요소가 있으므로 RankNav 컴포넌트에 pointer-events-auto가 있어야 함 (RankNav.tsx에서 처리됨) */}
              {isRankOpen && (
                <RankNav
                  level={rankLevel}
                  parentGuCode={
                    rankLevel === 'dong' ? selectedGu || undefined : undefined
                  }
                  parentGuName={
                    rankLevel === 'dong'
                      ? currentGuName || undefined
                      : undefined
                  }
                  selectedCategory={selectedCategory || undefined}
                  selectedSubCode={selectedSubCode}
                  onSubCodeChange={onSelectSubCode}
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
    </>
  );
}
