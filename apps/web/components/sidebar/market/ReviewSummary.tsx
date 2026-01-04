import React from 'react';

interface Props {
  reviewSummary: {
    naver: string;
  };
}

export default function ReviewSummary({ reviewSummary }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 px-1">📝 리뷰 요약</h3>
      <div className="grid grid-cols-1 gap-3">
        {/* 네이버 리뷰 카드 */}
        <div className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
          <div className="text-xs font-bold text-green-600 mb-1">NAVER</div>
          <p className="text-sm text-gray-700 leading-relaxed">{reviewSummary.naver}</p>
        </div>
      </div>
    </div>
  );
}