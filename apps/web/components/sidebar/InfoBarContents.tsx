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
  // 1. 업종이 선택된 경우 (지도 선택 여부와 관계없이 업종 분석이 메인)
  if (selectedCategory) {
    return (
      <IndustrySideContents selectedCategory={selectedCategory} data={data} />
    );
  }

  // 2. 지도만 선택된 경우 (기본 건물/지역 정보)
  if (data) {
    return <DetailContents data={data} />;
  }

  return null;
}
