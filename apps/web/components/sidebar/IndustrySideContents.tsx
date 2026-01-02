import React from 'react';
import { InfoBarData } from '../../types/map-types';
import { IndustryCategory } from '../../types/bottom-menu-types';
import RevenueCard from './RevenueCard';
import { useMapStore } from '@/stores/useMapStore';
import { useMapSync } from '@/hooks/useMapSync';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const DEFAULT_CITY_CODE = '11';

type RevenueItem = {
  code: string;
  name: string;
  amount: number;
  count: number;
};

type RevenueRankingResponse = {
  level: 'city' | 'gu' | 'dong' | 'backarea' | 'commercial';
  quarter: string;
  industryCode?: string;
  items: RevenueItem[];
};

type RevenueSummaryResponse = {
  level: 'city' | 'gu' | 'dong' | 'backarea' | 'commercial';
  code: string;
  quarter: string;
  totalAmount: number;
  totalCount: number;
  items: {
    industryCode: string;
    industryName: string;
    amount: number;
    count: number;
  }[];
};

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
  const [rankingItems, setRankingItems] = React.useState<RevenueItem[]>([]);
  const [summaryAmount, setSummaryAmount] = React.useState<number | null>(null);
  const [summaryQuarter, setSummaryQuarter] = React.useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const subCategories = React.useMemo(
    () => selectedCategory.children || [],
    [selectedCategory],
  );

  const { zoom, setSelectedIndustryCodes } = useMapStore();
  const { currentGuCode, currentGuName } = useMapSync();

  React.useEffect(() => {
    setSelectedSubCode(null);
  }, [selectedCategory.code]);

  React.useEffect(() => {
    if (selectedSubCode) {
      setSelectedIndustryCodes([selectedSubCode]);
    } else if (subCategories.length > 0) {
      setSelectedIndustryCodes(subCategories.map((c) => c.code));
    }
  }, [selectedSubCode, subCategories, setSelectedIndustryCodes]);

  const isZoomedIn = zoom <= 7;

  const rankingContext = React.useMemo(() => {
    if (isZoomedIn && currentGuCode) {
      return {
        level: 'dong',
        code: currentGuCode,
        name: currentGuName || '현재 지역',
        parentGuCode: currentGuCode,
      } as const;
    }

    return {
      level: 'gu',
      code: DEFAULT_CITY_CODE,
      name: '서울시',
      parentGuCode: undefined,
    } as const;
  }, [isZoomedIn, currentGuCode, currentGuName]);

  const areaInfo = React.useMemo(() => {
    if (!data) return null;

    const admCode = data.adm_cd ? String(data.adm_cd) : '';
    if (admCode.length >= 8) return { level: 'dong', code: admCode };
    if (admCode.length === 5) return { level: 'gu', code: admCode };
    if (admCode.length === 2) return { level: 'city', code: admCode };

    const commercialData = data as { dongCode?: string; guCode?: string };
    if (commercialData.dongCode) {
      return { level: 'dong', code: commercialData.dongCode };
    }
    if (commercialData.guCode) {
      return { level: 'gu', code: commercialData.guCode };
    }

    return null;
  }, [data]);

  const areaName = React.useMemo(() => {
    if (!data) return undefined;
    const commercialName = (data as { commercialName?: string }).commercialName;
    return commercialName || data.adm_nm || data.buld_nm || '정보 없음';
  }, [data]);

  React.useEffect(() => {
    if (!API_BASE_URL) {
      setError('API_BASE_URL이 설정되지 않았습니다.');
      return;
    }

    const controller = new AbortController();
    const industryCode = selectedSubCode || undefined;

    // 대분류 선택 시 하위 업종 코드들을 콤마로 구분해서 전송
    let industryCodes: string | undefined = undefined;
    if (!industryCode && subCategories.length > 0) {
      industryCodes = subCategories.map((c) => c.code).join(',');
    }

    const rankingLevel = rankingContext.level;
    const parentGuCode = rankingContext.parentGuCode;

    const summaryLevel =
      areaInfo?.level ?? (rankingContext.level === 'dong' ? 'gu' : 'city');
    const summaryCode =
      areaInfo?.code ??
      (rankingContext.level === 'dong'
        ? rankingContext.code
        : DEFAULT_CITY_CODE);

    setIsLoading(true);
    setError(null);

    const summaryUrl = new URL(`${API_BASE_URL}/revenue`);
    summaryUrl.searchParams.set('level', summaryLevel);
    summaryUrl.searchParams.set('code', summaryCode);
    if (industryCode) {
      summaryUrl.searchParams.set('industryCode', industryCode);
    } else if (industryCodes) {
      summaryUrl.searchParams.set('industryCodes', industryCodes);
    }

    const rankingUrl = new URL(`${API_BASE_URL}/revenue/ranking`);
    rankingUrl.searchParams.set('level', rankingLevel);
    if (parentGuCode) {
      rankingUrl.searchParams.set('parentGuCode', parentGuCode);
    }
    if (industryCode) {
      rankingUrl.searchParams.set('industryCode', industryCode);
    } else if (industryCodes) {
      rankingUrl.searchParams.set('industryCodes', industryCodes);
    }

    Promise.all([
      fetch(summaryUrl.toString(), { signal: controller.signal }),
      fetch(rankingUrl.toString(), { signal: controller.signal }),
    ])
      .then(async ([summaryRes, rankingRes]) => {
        if (!summaryRes.ok || !rankingRes.ok) {
          throw new Error('매출 데이터를 불러오지 못했습니다.');
        }

        const summaryData = (await summaryRes.json()) as RevenueSummaryResponse;
        const rankingData = (await rankingRes.json()) as RevenueRankingResponse;

        setSummaryAmount(summaryData.totalAmount);
        setSummaryQuarter(summaryData.quarter);
        setRankingItems(rankingData.items);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError('매출 데이터를 불러오지 못했습니다.');
        setRankingItems([]);
        setSummaryAmount(null);
        setSummaryQuarter(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [areaInfo, rankingContext, selectedSubCode, subCategories]);

  const matchedStat =
    areaName && rankingItems.length > 0
      ? rankingItems.find((item) => areaName.includes(item.name))
      : undefined;

  // 표시할 매출액 계산
  let displayAmountString = '데이터 없음';
  let description = '선택하신 지역/업종 기준 추정치입니다.';

  const formatRevenue = (amount: number) => {
    const revenueInOk = amount / 100000000;
    return `약 ${revenueInOk.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}억 원`;
  };

  if (isLoading) {
    displayAmountString = '로딩중...';
    description = '데이터를 불러오는 중입니다.';
  } else if (summaryAmount !== null) {
    // 이제 서버에서 필터링된 합계를 주므로 그대로 사용
    displayAmountString = formatRevenue(summaryAmount);

    if (areaName && matchedStat) {
      description = `${areaName}의 실제 통계 데이터입니다.`;
    } else if (summaryQuarter) {
      const subName =
        subCategories.find((s) => s.code === selectedSubCode)?.name ||
        selectedCategory.name;

      const contextName = areaInfo ? areaName : rankingContext.name;

      description = `${contextName} ${subName} ${
        rankingContext.level === 'dong' ? '(구 평균)' : '(서울시 평균)'
      } 추정치`;
    }
  } else if (rankingItems.length > 0) {
    const totalRevenue = rankingItems.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );
    const avgRevenue = totalRevenue / rankingItems.length;
    displayAmountString = `약 ${formatRevenue(avgRevenue)}`;
    description = rankingContext.name
      ? `${rankingContext.name} 평균 추정치입니다.`
      : '선택하신 업종의 평균 추정치입니다.';
  } else if (selectedSubCode && rankingItems.length === 0) {
    displayAmountString = '-';
    description = '해당 세부 업종의 데이터가 없습니다.';
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 1. 예상 매출 카드 (Dynamic) */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <RevenueCard
          title={`${
            subCategories.find((s) => s.code === selectedSubCode)?.name ||
            selectedCategory.name
          } 평균 매출 (분기)`}
          amount={displayAmountString}
          description={description}
        />
      </div>

      {/* 2. 세부 업종 선택 (Dropdown) */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          세부 업종 선택
        </h3>
        <div className="relative">
          <select
            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            value={selectedSubCode || ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSubCode(val === '' ? null : val);
            }}
          >
            <option value="">전체 {selectedCategory.name}</option>
            {subCategories.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. 지역별 매출 순위 */}
      {rankingItems.length > 0 ? (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {rankingContext.level === 'dong'
              ? `${rankingContext.name} 동별 매출 순위`
              : '서울시 구별 매출 순위'}
          </h3>
          <div className="space-y-3">
            {rankingItems.slice(0, 10).map((item, index) => (
              <div
                key={item.code}
                className={`flex items-center justify-center p-3 rounded-lg ${
                  item.code === matchedStat?.code
                    ? 'bg-blue-50 border border-blue-200 ring-1 ring-blue-300' // 선택된 지역 강조
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span
                    className={
                      'flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-blue-100 text-blue-600'
                    }
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {subCategories.find((s) => s.code === selectedSubCode)
                        ?.name || selectedCategory.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    {formatRevenue(item.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          {error ? error : '통계 데이터가 없습니다.'}
        </div>
      )}
    </div>
  );
}
