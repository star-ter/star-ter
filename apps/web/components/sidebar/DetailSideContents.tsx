import React from 'react';
import { InfoBarData } from '../../types/map-types';
import RevenueCard from './RevenueCard';

interface DetailContentsProps {
  data: InfoBarData;
}

export default function DetailContents({ data }: DetailContentsProps) {
  // 실제로는 API 등에서 건물의 기본 정보를 가져와야 함.
  // 현재는 임시값(약 2,975억 원)으로 유지.

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <RevenueCard
        title="11월 예상 매출"
        amount="약 2,975억 원"
        description="* star-ter의 매출 값은 데이터에 근거한 추정값입니다."
        highlight={true}
      />
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500 text-center">
          추정매출, 결제 시간대·요일·휴일여부, 성별 등의 정보가 들어와야합니다
        </p>
      </div>
    </div>
  );
}
