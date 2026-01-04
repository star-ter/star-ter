import React from 'react';
import { InfoBarData } from '../../types/map-types';
import DetailContents from './DetailSideContents';

interface InfoBarContentsProps {
  data: InfoBarData | null;
}

export default function InfoBarContents({ data }: InfoBarContentsProps) {
  // 지도 데이터가 선택된 경우
  if (data) {
    return <DetailContents key={`${data.x}-${data.y}`} data={data} />;
  }

  return null;
}
