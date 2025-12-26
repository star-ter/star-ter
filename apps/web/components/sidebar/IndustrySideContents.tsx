import React from 'react';
import { InfoBarData } from '../../types/map-types';
import {
  IndustryCategory,
  IndustryStatResponse,
} from '../../types/bottom-menu-types';
import { INDUSTRY_STATS_MOCK } from '../../mocks/industry-stats';
import RevenueCard from './RevenueCard';

interface IndustrySideContentsProps {
  selectedCategory: IndustryCategory;
  data: InfoBarData | null;
}

export default function IndustrySideContents({
  selectedCategory,
  data,
}: IndustrySideContentsProps) {
  const stats: IndustryStatResponse | undefined =
    INDUSTRY_STATS_MOCK[selectedCategory.code];
  const subCategories = selectedCategory.children || [];

  // 데이터(지역)가 있으면 해당 지역 이름 추출
  const areaName = data
    ? data.adm_nm || data.buld_nm || '정보 없음'
    : undefined;

  // 지역 매칭 로직
  // data가 있고, stats에 해당 지역 아이템이 있다면 찾음
  const matchedStat =
    stats && areaName
      ? stats.items.find((item) => areaName.includes(item.areaNm))
      : undefined;

  // 표시할 매출액 계산
  let displayAmountString = '데이터 없음';
  let description = '* 선택하신 지역/업종 기준 추정치입니다.';

  if (stats && stats.items.length > 0) {
    let revenue = 0;

    if (matchedStat) {
      // 1. 지역 매칭 성공: 해당 지역 매출
      revenue = matchedStat.arUnitAvrgSlsAmt;
      displayAmountString = `${revenue.toLocaleString()} 천원`;
      description = `* ${matchedStat.areaNm} 지역의 실제 통계 데이터입니다.`;
    } else {
      // 2. 지역 선택 안함 OR 매칭 실패: 전체 평균
      const totalRevenue = stats.items.reduce(
        (acc, curr) => acc + curr.arUnitAvrgSlsAmt,
        0,
      );
      revenue = totalRevenue / stats.items.length;
      displayAmountString = `약 ${revenue.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} 천원`;
      description = areaName
        ? `* ${areaName} 지역 데이터가 없어 평균값을 표시합니다.`
        : '* 서울시 업종 평균 추정치입니다.';
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 1. 예상 매출 카드 (Dynamic) */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <RevenueCard
          title={`${selectedCategory.name} 업종 평균 매출 (월)`}
          amount={displayAmountString}
          description={description}
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
                className={`flex items-center justify-center p-3 rounded-lg ${
                  item === matchedStat
                    ? 'bg-blue-50 border border-blue-200 ring-1 ring-blue-300' // 선택된 지역 강조
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
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

      {/* 4. TODO Placeholder */}
      <div className="mt-4 mx-4 p-4 bg-gray-50 border border-gray-200 rounded-lg mb-8">
        <p className="text-sm text-gray-500 text-center">
          추정매출, 결제 시간대·요일·휴일여부, 성별 등의 정보가 들어올
          예정입니다.
        </p>
      </div>
    </div>
  );
}
