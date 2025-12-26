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
  // 1. 지도 데이터가 있는 경우 (건물/지역 상세)
  if (data) {
    return <DetailContents data={data} selectedCategory={selectedCategory} />;
  }

  // 2. 업종만 선택된 경우 (업종 분석)
  if (selectedCategory) {
    return <IndustrySideContents selectedCategory={selectedCategory} />;
  }

  return null;
}
