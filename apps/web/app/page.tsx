'use client';
import { useState } from 'react';

import Kakaomap from '@/components/kakaomap';
import MapBox from '@/components/map/MapBox';
import { usePopulationVisual } from '@/hooks/usePopulationVisual';
import ComparisonOverlay from '@/components/comparison/ComparisonOverlay';

import { useSidebarStore } from '@/stores/useSidebarStore';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { IndustryCategory, CompareRequest } from '@/types/bottom-menu-types';

export default function Home() {
  const { isOpen, width, isResizing } = useSidebarStore();
  const { isVisible: isComparisonVisible, closeComparison, openComparison, dataA: comparisonDataA, dataB: comparisonDataB } = useComparisonStore();
  
  // Location State now holds both Name and Code
  const [locationA, setLocationA] = useState<{name: string, code?: string}>({ name: '' });
  const [locationB, setLocationB] = useState<{name: string, code?: string}>({ name: '' });
  const [pickTarget, setPickTarget] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<IndustryCategory | null>(null);

  // 유동인구 상태 통합
  const population = usePopulationVisual();

  // 비교 마커 첫번째인지 두번째인지 판단
  function handlePickMode(target: 'A' | 'B') {
    console.log('선택모드 시작합니다.');
    setPickTarget(target);
  }
  // 지도를 클릭 (Updated to accept object)
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

  // Handle Comparison Trigger (Manual via MapBox)
  function handleCompareRequest(data?: CompareRequest) {
    // If data comes from search (codes + names), use them. 
    // Otherwise fallback to locationA string (which might be name or code, usually name from Map)
    
    // Code: The ID used for API fetching
    const codeA = data?.targetA || locationA.code || locationA.name || '지역 A';
    const codeB = data?.targetB || locationB.code || locationB.name || '지역 B';

    // Name: The display title
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
      }
    );
  }

  return (
    <div 
      className="relative h-screen w-screen overflow-hidden"
    >
      {/* Comparison Overlay */}
      <ComparisonOverlay
        isVisible={isComparisonVisible}
        onClose={closeComparison}
        // Fallbacks to avoid null errors if specific data isn't set yet
        dataA={comparisonDataA || {
          title: '정보 없음',
          address: '-',
          estimatedSales: '0',
          salesChange: '',
          storeCount: '0'
        }}
        dataB={comparisonDataB || {
          title: '정보 없음',
          address: '-',
          estimatedSales: '0',
          salesChange: '',
          storeCount: '0'
        }}
      />
      <div className="absolute inset-0 z-0">
        <Kakaomap
          polygonClick={mapClick}
          population={population}
          selectedCategory={selectedCategory}
          onClearCategory={() => setSelectedCategory(null)}
          disableInfoBar={!!pickTarget}
        />
      </div>
      <div className="z-10 pointer-events-none">
        <MapBox
          locationA={locationA}
          locationB={locationB}
          setLocationA={setLocationA}
          setLocationB={setLocationB}
          handlePickMode={handlePickMode}
          population={population}
          onCompare={handleCompareRequest}
          onSelectCategory={setSelectedCategory}
        />
      </div>
    </div>
  );
}
