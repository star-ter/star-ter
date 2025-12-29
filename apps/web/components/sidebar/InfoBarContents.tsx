import React from 'react';
import { InfoBarData } from '../../types/map-types';
import { IndustryCategory } from '../../types/bottom-menu-types';
import DetailContents from './DetailSideContents';
import IndustrySideContents from './IndustrySideContents';

interface InfoBarContentsProps {
  data: InfoBarData | null;
  selectedCategory: IndustryCategory | null;
}

export default function InfoBarContents({
  data,
  selectedCategory,
}: InfoBarContentsProps) {
  // 1. 지도(건물/지역)가 선택된 경우 최우선
  if (data) {
    return <DetailContents key={`${data.x}-${data.y}`} data={data} />;
  }

  // 2. 업종만 선택된 경우
  if (selectedCategory) {
    return (
      <IndustrySideContents selectedCategory={selectedCategory} data={null} /> // data is handled above
    );
  }

  return null;
}
