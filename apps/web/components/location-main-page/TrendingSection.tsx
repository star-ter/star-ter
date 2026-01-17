'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  fetchLocationRanking,
  LocationRankItem,
} from '@/services/location/location.service';

export function TrendingSection() {
  const [data, setData] = useState<LocationRankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchLocationRanking(
          'commercial',
          undefined,
          'growth',
        );
        setData(result.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch trending locations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section className="px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h3 font-heading text-foreground">
          급상승 중인 신흥 트렌드 상권
        </h2>
        <Link
          href="/locations/search?tab=매출 성장 순"
          className="flex items-center gap-1 text-body font-strong text-muted-foreground hover:text-foreground transition-colors"
        >
          더보기 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-72 shrink-0 rounded-2xl bg-background shadow-sm border border-border p-5 animate-pulse h-40"
                >
                  <div className="h-5 w-16 rounded-full bg-muted mb-3" />
                  <div className="h-5 w-40 rounded bg-muted mb-2" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
              ))
            : data.map((item) => (
                <Link
                  key={item.code}
                  href={`/locations/detail/${item.code}`}
                  className="w-72 shrink-0 rounded-2xl bg-background shadow-sm border border-border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="inline-block px-3 py-1 rounded-full text-tiny font-heading text-primary-foreground bg-destructive mb-2">
                    {item.growthRate > 50
                      ? '폭발 성장'
                      : item.growthRate > 20
                        ? '급성장'
                        : '성장'}
                  </span>
                  <h4 className="text-h5 font-heading text-foreground mb-1 line-clamp-1">
                    {item.name}
                  </h4>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <span className="text-caption font-strong text-muted-foreground block">
                        평균 매출
                      </span>
                      <span className="text-h5 font-heading">
                        {item.avgRevenue}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-caption font-strong text-muted-foreground block">
                        성장률
                      </span>
                      <span className="text-h5 font-heading text-success">
                        +{item.growthRate.toFixed(1)}%
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
