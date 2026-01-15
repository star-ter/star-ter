'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchLocationRanking,
  LocationRankItem,
} from '@/services/location/location.service';

export function AverageSalesSection() {
  const [data, setData] = useState<LocationRankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 평균 매출순 상위 5개
        const result = await fetchLocationRanking(
          'commercial',
          undefined,
          'average',
        );
        setData(result.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch average sales locations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section className="px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h3 font-heading text-slate-900">
          평균 매출 순 상권
        </h2>
        <Link
          href="/locations/search?tab=평균 매출 순"
          className="text-body font-strong text-slate-400 hover:text-slate-600 transition-colors"
        >
          더보기 &gt;
        </Link>
      </div>

      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-72 shrink-0 rounded-2xl bg-white shadow-sm border border-slate-100 p-5 animate-pulse h-40"
                >
                  <div className="h-5 w-16 rounded-full bg-slate-100 mb-3" />
                  <div className="h-5 w-40 rounded bg-slate-100 mb-2" />
                  <div className="h-4 w-24 rounded bg-slate-100" />
                </div>
              ))
            : data.map((item, index) => (
                <Link
                  key={item.code}
                  href={`/locations/detail/${item.code}`}
                  className="w-72 shrink-0 rounded-2xl bg-white shadow-sm border border-slate-100 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="inline-block px-3 py-1 rounded-full text-tiny font-heading text-white bg-blue-500 mb-2">
                    TOP {index + 1}
                  </span>
                  <h4 className="text-h5 font-heading text-slate-900 mb-1 line-clamp-1">
                    {item.name}
                  </h4>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <span className="text-caption font-strong text-slate-400 block">
                        평균 매출
                      </span>
                      <span className="text-h5 font-heading">
                        {item.avgRevenue}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-caption font-strong text-slate-400 block">
                        성장률
                      </span>
                      <span
                        className={`text-h5 font-heading ${item.growthRate > 0 ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        {item.growthRate > 0 ? '+' : ''}
                        {item.growthRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
