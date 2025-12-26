'use client';

import { useRef, useState } from 'react';
import { initProj4 } from '../utils/map-utils';
import { InfoBarData } from '../types/map-types';
import InfoBar from './sidebar/InfoBar';
import { useKakaoMap } from '../hooks/useKakaoMap';
import { usePolygonData } from '../hooks/usePolygonData';
import { IndustryCategory } from '../types/bottom-menu-types';

initProj4();

interface KakaomapProps {
  polygonClick?: (area: string) => void;
  selectedCategory?: IndustryCategory | null;
  onClearCategory?: () => void;
}

export default function Kakaomap({
  polygonClick = (_area: string) => {},
  selectedCategory = null,
  onClearCategory = () => {},
}: KakaomapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<InfoBarData | null>(null);

  // 1. Load Map
  const { map } = useKakaoMap(mapRef);

  // 2. Handle map data & logic
  usePolygonData(map, (data: InfoBarData) => {
    setSelectedArea(data);
    if (polygonClick) {
      const label = data.adm_nm || data.buld_nm || 'Unknown';
      polygonClick(label);
    }
  });

  return (
    <div className="relative w-full h-full">
      <InfoBar
        data={selectedArea}
        selectedCategory={selectedCategory}
        onClose={() => {
          setSelectedArea(null);
          if (selectedCategory) {
            onClearCategory();
          }
        }}
      />

      <div
        ref={mapRef}
        className="w-full h-100 bg-gray-100"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}
