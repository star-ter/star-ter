import React from 'react';
import { InfoBarData } from '../../types/map-types';
import { IndustryCategory } from '../../types/bottom-menu-types';
import { INDUSTRY_STATS_MOCK } from '../../mocks/industry-stats';
import RevenueCard from './RevenueCard';

interface DetailContentsProps {
  data: InfoBarData;
  selectedCategory: IndustryCategory | null;
}

export default function DetailContents({
  data,
  selectedCategory,
}: DetailContentsProps) {
  const name = data.adm_nm || data.buld_nm || '정보 없음';

  // 업종 데이터 준비
  const stats = selectedCategory
    ? INDUSTRY_STATS_MOCK[selectedCategory.code]
    : undefined;
  const subCategories = selectedCategory?.children || [];

  // 매출 계산 로직
  const matchedStat = stats?.items.find((item) => name.includes(item.areaNm));
  const displayRevenue = matchedStat
    ? matchedStat.arUnitAvrgSlsAmt
    : stats
      ? stats.items.reduce((acc, curr) => acc + curr.arUnitAvrgSlsAmt, 0) /
        stats.items.length
      : 297500000; // 기본값

  // 포맷팅
  const formattedRevenue = matchedStat
    ? `${displayRevenue.toLocaleString()} 천원`
    : stats
      ? `약 ${displayRevenue.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })} 천원`
      : '약 2,975억 원';

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* 예상 매출 카드 */}
      <RevenueCard
        title={
          selectedCategory
            ? `${selectedCategory.name} 업종 예상 매출 (월)`
            : '11월 예상 매출'
        }
        amount={formattedRevenue}
        description="* star-ter의 매출 값은 데이터에 근거한 추정값입니다."
        highlight={true}
      />
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500 text-center">
          {/* TODO: 추정매출, 결제 시간대·요일·휴일여부, 성별 등의 정보 fetch 후 그리는 로직 구현 */}
          추정매출, 결제 시간대·요일·휴일여부, 성별 등의 정보가 들어와야합니다
        </p>
      </div>

      {/* 업종 선택 시 추가 정보 표시 */}
      {selectedCategory && stats && (
        <>
          {/* 세부 업종 선택 */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {selectedCategory.name} 세부 업종
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

          {/* 지역별 매출 순위 */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              서울시 {selectedCategory.name} 매출 순위
            </h3>
            <div className="space-y-3">
              {stats.items.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-blue-100 text-blue-600">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.areaNm}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-blue-600 text-sm">
                    {item.arUnitAvrgSlsAmt.toLocaleString()} 천원
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
