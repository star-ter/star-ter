'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { InfoBarData } from '../../types/map-types';
import InfoBarHeader from './InfoBarHeader';
import InfoBarContents from './InfoBarContents';
import { useSidebarStore } from '../../stores/useSidebarStore';

interface InfoBarProps {
  data: InfoBarData | null;
  onClose: () => void;
}

export default function InfoBar({ data, onClose }: InfoBarProps) {
  const [mounted, setMounted] = useState(false);
  const { isInfoBarOpen } = useSidebarStore();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 데이터가 없거나 사이드바가 닫혀있으면 렌더링하지 않음
  if (!mounted || !data || !isInfoBarOpen) return null;

  // 헤더 타이틀 계산
  let title: React.ReactNode = '';
  let subTitle: React.ReactNode = '';

  if (data.buld_nm) {
    // 건물명이 있으면 최우선 표시
    title = data.buld_nm;
    subTitle = data.adm_nm || '';
  } else {
    // 건물명이 없으면 행정구역명 파싱
    const name = data.adm_nm || '정보 없음';
    const nameParts = name.split(' ');
    title = nameParts[nameParts.length - 1]; // e.g. "삼성동" or "강남구"
    subTitle =
      nameParts.length > 1
        ? nameParts.slice(0, nameParts.length - 1).join(' ')
        : '';
  }

  return createPortal(
    <div className="fixed top-0 left-0 z-300 h-full w-90 bg-white shadow-xl transition-transform duration-300 ease-in-out transform translate-x-0">
      <div className="flex flex-col h-full">
        {/* 헤더 */}
        <InfoBarHeader title={title} subTitle={subTitle} onClose={onClose} />

        {/* 컨텐츠 */}
        <InfoBarContents data={data} />
      </div>
    </div>,
    document.body,
  );
}
