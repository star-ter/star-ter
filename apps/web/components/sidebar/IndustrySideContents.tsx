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
  const [selectedSubCode, setSelectedSubCode] = React.useState<string | null>(
    null,
  );

  // TODO: 백엔드 연결 - selectedCategory의 매출 데이터를 db/api에서 조회 - 현재 mock 데이터
  const stats: IndustryStatResponse | undefined =
    INDUSTRY_STATS_MOCK[selectedCategory.code];
  const subCategories = React.useMemo(
    () => selectedCategory.children || [],
    [selectedCategory],
  );

  // 데이터(지역)가 있으면 해당 지역 이름 추출
  const areaName = data
    ? data.adm_nm || data.buld_nm || '정보 없음'
    : undefined;

  // 선택된 세부업종이 있으면 그것만 남기고, 없으면 전체(stats.items) 사용
  const filteredItems = React.useMemo(() => {
    if (!stats) return [];
    if (!selectedSubCode) return stats.items;

    // TODO: api 응답에 indutyMlsfcCd(업종코드)가 포함
    return stats.items.filter((item) => item.indutyMlsfcCd === selectedSubCode);
  }, [stats, selectedSubCode]);

  // 2. 지역 매칭 로직 (필터된 리스트에서 찾음)
  // data가 있고, stats에 해당 지역 아이템이 있다면 찾음
  const matchedStat =
    areaName && filteredItems.length > 0
      ? filteredItems.find((item) => areaName.includes(item.areaNm))
      : undefined;

  // 표시할 매출액 계산
  let displayAmountString = '데이터 없음';
  let description = '* 선택하신 지역/업종 기준 추정치입니다.';

  if (filteredItems.length > 0) {
    let revenue = 0;

    if (matchedStat) {
      // 1. 지역 매칭 성공: 해당 지역 매출
      revenue = matchedStat.arUnitAvrgSlsAmt;
      const revenueInOk = revenue / 100000;
      displayAmountString = `${revenueInOk.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} 억원`;
      description = `* ${matchedStat.areaNm} 지역의 실제 통계 데이터입니다.`;
    } else {
      // 2. 지역 선택 안함: 필터된 리스트의 평균
      const totalRevenue = filteredItems.reduce(
        (acc, curr) => acc + curr.arUnitAvrgSlsAmt,
        0,
      );
      revenue = totalRevenue / filteredItems.length;
      const revenueInOk = revenue / 100000;
      const subName =
        subCategories.find((s) => s.code === selectedSubCode)?.name ||
        selectedCategory.name;

      displayAmountString = `약 ${revenueInOk.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}억 원`;
      description = areaName
        ? `* ${areaName}의 ${subName} 데이터가 없어 상위 평균을 표시합니다.`
        : `* 서울시 ${subName} 업종 평균 추정치입니다.`;
    }
  } else if (selectedSubCode && stats) {
    displayAmountString = '-';
    description = '* 해당 세부 업종의 데이터가 없습니다.';
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 1. 예상 매출 카드 (Dynamic) */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <RevenueCard
          title={`${
            subCategories.find((s) => s.code === selectedSubCode)?.name ||
            selectedCategory.name
          } 평균 매출 (월)`}
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
          {subCategories.map((sub) => {
            const isSelected = selectedSubCode === sub.code;
            return (
              <button
                key={sub.code}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                }`}
                onClick={() => setSelectedSubCode(isSelected ? null : sub.code)}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 지역별 매출 순위 */}
      {stats && filteredItems.length > 0 ? (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            지역별 매출 순위
          </h3>
          <div className="space-y-3">
            {filteredItems.slice(0, 10).map((item, index) => (
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
                    {(item.arUnitAvrgSlsAmt / 100000).toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 2,
                      },
                    )}
                    억 원
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
