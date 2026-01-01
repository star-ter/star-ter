import { useEffect, useMemo, useState } from 'react';
import { geocodeAddress } from '@/services/geocoding/geocoding.service';
import { useMapStore } from '@/stores/useMapStore';

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
  industryCode?: string;
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
  industryCode,
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
    if (industryCode) url.searchParams.set('industryCode', industryCode);
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
        // 최소 로딩 시간 보장 (깜빡임 방지)
        const elapsed = Date.now() - startTime;
        const minLoadingTime = 500; // 0.5초
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
        // 컴포넌트가 언마운트되지 않았는지 확인하는 로직이 있으면 좋지만,
        // useEffect cleanup에서 abort하므로 괜찮음.
        // 다만 비동기 delay 후 state 업데이트 시 mounted 체크가 안전함.
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [level, parentGuCode, industryCode]);

  const formatAmount = (amount: number) => {
    const revenueInOk = amount / 100000000;
    return `${revenueInOk.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}억`;
  };

  return (
    <aside className="w-[330px] ml-4 z-300 rounded-2xl bg-white/90 p-3.5 shadow-lg ring-1 ring-black/5 backdrop-blur pointer-events-auto">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {level === 'dong' && parentGuName
              ? `${parentGuName} 매출 순위`
              : level === 'dong'
                ? '동 매출 순위'
                : '서울시 매출 순위'}
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            {level === 'dong' && parentGuName
              ? `${parentGuName} 기준`
              : level === 'dong'
                ? '현재 구 기준'
                : '서울시 기준'}{' '}
            분기 매출
          </p>
        </div>

        {/* Info Tooltip */}
        <div className="relative group p-1">
          <svg
            className="w-5 h-5 text-gray-400 cursor-help hover:text-gray-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-xl p-3 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            <h4 className="font-bold mb-2 text-gray-200 pb-1 border-b border-gray-700">
              상권 유형 안내
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="text-blue-300 font-semibold min-w-16">
                  뜨는 상권
                </span>
                <span className="text-gray-300">
                  개업은 많고 폐업은 적어 성장하는 지역
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-400 font-semibold min-w-16">
                  변동 상권
                </span>
                <span className="text-gray-300">
                  개업과 폐업이 모두 많아 변화가 심한 지역
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 font-semibold min-w-16">
                  정체 상권
                </span>
                <span className="text-gray-300">
                  개업과 폐업이 모두 적어 변화가 없는 지역
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-red-400 font-semibold min-w-16">
                  위험 상권
                </span>
                <span className="text-gray-300">
                  개업은 적고 폐업이 많아 쇠퇴하는 지역
                </span>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-0 right-2 -mt-1 w-2 h-2 bg-gray-900/90 rotate-45 transform"></div>
          </div>
        </div>
      </header>

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
