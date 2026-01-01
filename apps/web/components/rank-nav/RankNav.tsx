import { useMemo } from 'react';
import { useRevenueRanking } from '@/hooks/useRevenueRanking';
import RankNavHeader from './RankNavHeader';
import RankNavItem from './RankNavItem';

type RankNavProps = {
  level?: 'gu' | 'dong';
  parentGuCode?: string;
  parentGuName?: string;
  industryCode?: string;
};

export default function RankNav({
  level = 'gu',
  parentGuCode,
  parentGuName,
  industryCode,
}: RankNavProps) {
  const { items, isLoading, error, isMoving, handleSelect, formatAmount } =
    useRevenueRanking({
      level,
      parentGuCode,
      industryCode,
    });

  const formattedItems = useMemo(() => items.slice(0, 10), [items]);

  return (
    <aside className="w-[330px] ml-4 z-300 rounded-2xl bg-white/90 p-3.5 shadow-lg ring-1 ring-black/5 backdrop-blur pointer-events-auto">
      <RankNavHeader level={level} parentGuName={parentGuName} />

      <div className="space-y-2">
        {isLoading ? (
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
            <RankNavItem
              key={item.code}
              item={item}
              rank={index + 1}
              onClick={() => handleSelect(item.name)}
              disabled={isMoving}
              formatAmount={formatAmount}
            />
          ))
        )}
      </div>
    </aside>
  );
}
