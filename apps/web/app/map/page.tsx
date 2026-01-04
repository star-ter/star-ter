'use client';
import { useState, useCallback } from 'react';

import Kakaomap from '@/components/kakaomap';
import MapOverlay from '@/components/map-overlay/MapOverlay';
import { usePopulationVisual } from '@/hooks/usePopulationVisual';
import ComparisonOverlay from '@/components/comparison/ComparisonOverlay';

import { useComparisonStore } from '@/stores/useComparisonStore';
import ReportOverlay from '@/components/report-overlay/ReportOverlay';
import { IndustryCategory, CompareRequest, ReportRequest } from '@/types/bottom-menu-types';

export default function MapPage() {
  const {
    isVisible: isComparisonVisible,
    closeComparison,
    openComparison,
    dataA: comparisonDataA,
    dataB: comparisonDataB,
  } = useComparisonStore();

  const [locationA, setLocationA] = useState<{ name: string; code?: string }>({
    name: '',
  });
  const [locationB, setLocationB] = useState<{ name: string; code?: string }>({
    name: '',
  });
  const [pickTarget, setPickTarget] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<IndustryCategory | null>(null);
  const [selectedSubCode, setSelectedSubCode] = useState<string | null>(null);

  // Report Overlay State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportRequest, setReportRequest] = useState<ReportRequest | null>(null);

  const population = usePopulationVisual();

  // 업종 선택 핸들러 - 선택 시 세부 코드 초기화
  const handleSelectCategory = useCallback((category: IndustryCategory | null) => {
    setSelectedCategory(category);
    setSelectedSubCode(null);
  }, []);

  // 비교 마커 첫번째인지 두번째인지 판단
  function handlePickMode(target: 'A' | 'B') {
    console.log('선택모드 시작합니다.');
    setPickTarget(target);
  }
  function mapClick(data: { name: string; code?: string }) {
    if (pickTarget === 'A') {
      setLocationA(data);
      setPickTarget('');
      return;
    } else if (pickTarget === 'B') {
      setLocationB(data);
      setPickTarget('');
      return;
    }
  }

  function handleCompareRequest(data?: CompareRequest) {

    const codeA = data?.targetA || locationA.code || locationA.name || '지역 A';
    const codeB = data?.targetB || locationB.code || locationB.name || '지역 B';

    const titleA = data?.targetNameA || locationA.name || '지역 A';
    const titleB = data?.targetNameB || locationB.name || '지역 B';

    openComparison(
      {
        title: titleA,
        address: '-',
        estimatedSales: '-',
        salesChange: '-',
        storeCount: '-',
        regionCode: codeA,
      },
      {
        title: titleB,
        address: '-',
        estimatedSales: '-',
        salesChange: '-',
        storeCount: '-',
        regionCode: codeB,
      },
    );
  }

  function handleCreateReport(data: ReportRequest) {
    setReportRequest(data);
    setIsReportOpen(true);
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <ComparisonOverlay
        isVisible={isComparisonVisible}
        onClose={closeComparison}
        dataA={
          comparisonDataA || {
            title: '정보 없음',
            address: '-',
            estimatedSales: '0',
            salesChange: '',
            storeCount: '0',
          }
        }
        dataB={
          comparisonDataB || {
            title: '정보 없음',
            address: '-',
            estimatedSales: '0',
            salesChange: '',
            storeCount: '0',
          }
        }
      />

      {/* Report Overlay */}
      <ReportOverlay 
        isVisible={isReportOpen} 
        onClose={() => setIsReportOpen(false)}
        userSelection={reportRequest}
      />

      <div className="absolute inset-0 z-0">
        <Kakaomap
          polygonClick={mapClick}
          population={population}
          selectedCategory={selectedCategory}
          selectedSubCategoryCode={selectedSubCode}
          onClearCategory={() => handleSelectCategory(null)}
          disableInfoBar={!!pickTarget}
        />
      </div>
      <div className="z-10 pointer-events-none">
        <MapOverlay
          locationA={locationA}
          locationB={locationB}
          setLocationA={setLocationA}
          setLocationB={setLocationB}
          handlePickMode={handlePickMode}
          population={population}
          onCompare={handleCompareRequest}
          onSelectCategory={handleSelectCategory}
          selectedCategory={selectedCategory}
          selectedSubCode={selectedSubCode}
          onSelectSubCode={setSelectedSubCode}
          onCreateReport={handleCreateReport}
          isReportOpen={isReportOpen}
          onToggleReport={setIsReportOpen}
        />
      </div>
    </div>
  );
}
