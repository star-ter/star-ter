'use client';
import { useState } from 'react';

import Kakaomap from '@/components/kakaomap';
import MapBox from '@/components/map/MapBox';
import ComparisonOverlay from '@/components/comparison/ComparisonOverlay';

import { useSidebarStore } from '@/stores/useSidebarStore';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { IndustryCategory } from '@/types/bottom-menu-types';

export default function Home() {
  const { isOpen, width, isResizing } = useSidebarStore();
  const { isVisible: isComparisonVisible, closeComparison, openComparison, dataA: comparisonDataA, dataB: comparisonDataB } = useComparisonStore();
  
  const [locationA, setLocationA] = useState('');
  const [locationB, setLocationB] = useState('');
  const [pickTarget, setPickTarget] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<IndustryCategory | null>(null);

  // 비교 마커 첫번째인지 두번째인지 판단
  function handlePickMode(target: 'A' | 'B') {
    console.log('선택모드 시작합니다.');
    setPickTarget(target);
  }
  // 지도를 클릭
  function mapClick(area: string) {
    if (pickTarget === 'A') {
      setLocationA(area);
      setPickTarget('');
      return;
    } else if (pickTarget === 'B') {
      setLocationB(area);
      setPickTarget('');
      return;
    }
  }

  // Handle Comparison Trigger (Manual via MapBox)
  function handleCompareRequest() {
    openComparison(
      {
        title: locationA || '동작구 사당1동 중심 상권',
        address: '서울 동작구 주소...',
        estimatedSales: '약 242억 원',
        salesChange: '',
        storeCount: '400',
      },
      {
        title: locationB || '관악구 중앙동 중심 상권',
        address: '서울 관악구 주소...',
        estimatedSales: '약 220억 원',
        salesChange: '',
        storeCount: '350',
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
      
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Kakaomap
          polygonClick={mapClick}
          selectedCategory={selectedCategory}
          onClearCategory={() => setSelectedCategory(null)}
        />
      </div>
      <div className="fixed inset-0 z-10 pointer-events-none">
        <MapBox
          locationA={locationA}
          locationB={locationB}
          setLocationA={setLocationA}
          setLocationB={setLocationB}
          handlePickMode={handlePickMode}
          onCompare={handleCompareRequest}
          onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>
      </div>
  );
}
