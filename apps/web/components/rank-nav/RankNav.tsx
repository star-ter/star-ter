import { useEffect, useMemo, useState } from 'react';
import { geocodeAddress } from '@/services/geocoding/geocoding.service';
import { useMapStore } from '@/stores/useMapStore';
import { IndustryCategory } from '../../types/bottom-menu-types';
import RankNavHeader from './RankNavHeader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type RankItem = {
  code: string;
  name: string;
  amount: number;
  count: number;
  changeType?: string;
};

type RevenueRankingResponse = {
  level: 'gu' | 'dong';
  quarter: string;
  industryCode?: string;
  items: RankItem[];
};

type RankNavProps = {
  level?: 'gu' | 'dong';
  parentGuCode?: string;
  parentGuName?: string;
  selectedCategory?: IndustryCategory;
  selectedSubCode?: string | null;
  onSubCodeChange?: (code: string | null) => void;
};

const changeLabelMap: Record<string, string> = {
  HH: '정체 상권',
  LL: '변동 상권',
  HL: '위험 상권',
  LH: '뜨는 상권',
};

export default function RankNav({
  level = 'gu',
  parentGuCode,
  parentGuName,
  selectedCategory,
  selectedSubCode,
  onSubCodeChange,
}: RankNavProps) {
  const { moveToLocation } = useMapStore();
  const [isMoving, setIsMoving] = useState(false);
  const [items, setItems] = useState<RankItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (name: string) => {
    if (isMoving) return;
    setIsMoving(true);
    try {
      const result = await geocodeAddress(`서울특별시 ${name}`);
      if (result) {
        moveToLocation(
          { lat: result.lat, lng: result.lng },
          result.address || name,
          level === 'dong' ? 5 : 7,
        );
      }
    } finally {
      setIsMoving(false);
    }
  };

  const formattedItems = useMemo(() => items.slice(0, 10), [items]);

  useEffect(() => {
    if (!API_BASE_URL) {
      setError('API_BASE_URL이 설정되지 않았습니다.');
      return;
    }

    const controller = new AbortController();
    const url = new URL(`${API_BASE_URL}/revenue/ranking`);
    url.searchParams.set('level', level);

    if (selectedSubCode) {
      url.searchParams.set('industryCode', selectedSubCode);
    } else if (selectedCategory) {
      if (selectedCategory.children && selectedCategory.children.length > 0) {
        const allCodes = selectedCategory.children.map((c) => c.code).join(',');
        url.searchParams.set('industryCodes', allCodes);
      } else {
        url.searchParams.set('industryCode', selectedCategory.code);
      }
    }

    if (level === 'dong' && parentGuCode) {
      url.searchParams.set('parentGuCode', parentGuCode);
    }

    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    fetch(url.toString(), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('순위 데이터를 불러오지 못했습니다.');
        return res.json();
      })
      .then(async (data: RevenueRankingResponse) => {
        const elapsed = Date.now() - startTime;
        const minLoadingTime = 500;
        if (elapsed < minLoadingTime) {
          await new Promise((resolve) =>
            setTimeout(resolve, minLoadingTime - elapsed),
          );
        }
        setItems(data.items || []);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError('순위 데이터를 불러오지 못했습니다.');
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [level, parentGuCode, selectedCategory, selectedSubCode]);

  const formatAmount = (amount: number) => {
    const revenueInOk = amount / 100000000;
    return `${revenueInOk.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}억`;
  };

  return (
    <aside className="w-[330px] ml-4 z-300 rounded-2xl bg-white/90 p-3.5 shadow-lg ring-1 ring-black/5 backdrop-blur pointer-events-auto">
      <RankNavHeader
        level={level}
        areaName={parentGuName}
        categoryName={selectedCategory?.name}
        selectedCategory={selectedCategory}
        selectedSubCode={selectedSubCode || null}
        onSubCodeChange={(code) => onSubCodeChange?.(code)}
      />

      <div className="space-y-2">
        {isLoading ? (
          // Skeleton UI
          Array.from({ length: 10 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2"
            >
              <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
              </div>
              <div className="h-5 w-12 rounded-full bg-gray-200 animate-pulse" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-2 py-3 text-center text-sm text-gray-500">
            {error || '표시할 순위가 없습니다.'}
          </div>
        ) : (
          formattedItems.map((item, index) => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.name)}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-gray-50/80 px-3 py-2 text-left transition hover:border-gray-200 hover:bg-white disabled:cursor-wait disabled:opacity-70"
              disabled={isMoving}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <div className="flex flex-1 items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-900">
                  {item.name}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {formatAmount(item.amount)}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                  changeLabelMap[item.changeType || '']?.includes('뜨는')
                    ? 'bg-blue-100 text-blue-700'
                    : changeLabelMap[item.changeType || '']?.includes('위험')
                      ? 'bg-red-100 text-red-700'
                      : changeLabelMap[item.changeType || '']?.includes(
                            '확장',
                          ) ||
                          changeLabelMap[item.changeType || '']?.includes(
                            '변동',
                          )
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                }`}
              >
                {changeLabelMap[item.changeType || ''] || '정보 없음'}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
