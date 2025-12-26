import React from 'react';
import {
  IndustryCategory,
  IndustryStatResponse,
} from '../../types/bottom-menu-types';
import { INDUSTRY_STATS_MOCK } from '../../mocks/industry-stats';
import RevenueCard from './RevenueCard';

interface IndustrySideContentsProps {
  selectedCategory: IndustryCategory;
}

export default function IndustrySideContents({
  selectedCategory,
}: IndustrySideContentsProps) {
  const stats: IndustryStatResponse | undefined =
    INDUSTRY_STATS_MOCK[selectedCategory.code];
  const subCategories = selectedCategory.children || [];

  const amount =
    stats && stats.items.length > 0
      ? `약 ${(
          stats.items.reduce((acc, curr) => acc + curr.arUnitAvrgSlsAmt, 0) /
          stats.items.length
        ).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })} 천원`
      : '데이터 없음';

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 1. 예상 매출 카드 (Dynamic) */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <RevenueCard
          title={`${selectedCategory.name} 업종 평균 매출 (월)`}
          amount={amount}
          description="* 선택하신 지역/업종 기준 추정치입니다."
        />
      </div>

      {/* 2. 세부 업종 선택 (Chips) */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          세부 업종 선택
        </h3>
        <div className="flex flex-wrap gap-2">
          {subCategories.map((sub) => (
            <button
              key={sub.code}
              className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full border border-gray-200 hover:border-blue-200 transition-colors"
              onClick={() => console.log('Sub selected:', sub.name)}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 지역별 매출 순위 */}
      {stats && stats.items.length > 0 ? (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            지역별 매출 순위 (TOP 10)
          </h3>
          <div className="space-y-3">
            {stats.items.slice(0, 10).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${index < 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.areaNm}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.indutyMlsfcNm}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    {item.arUnitAvrgSlsAmt.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.crrncyUnitCdNm}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          통계 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
