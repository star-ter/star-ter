'use client';
import { useState } from 'react';

import Kakaomap from '@/components/kakaomap';
import MapBox from '@/components/map/MapBox';
import { usePopulationVisual } from '@/hooks/usePopulationVisual';

export default function Home() {
  const [locationA, setLocationA] = useState('');
  const [locationB, setLocationB] = useState('');
  const [pickTarget, setPickTarget] = useState('');

  // 유동인구 상태 통합
  const population = usePopulationVisual();

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

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Kakaomap polygonClick={mapClick} population={population} />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <MapBox
          locationA={locationA}
          locationB={locationB}
          setLocationA={setLocationA}
          setLocationB={setLocationB}
          handlePickMode={handlePickMode}
          population={population}
        />
      </div>
    </div>
  );
}
