'use client';

import { useEffect, useState, useCallback } from 'react';

interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
  image?: string;
}

interface NewsSectionProps {
  region?: string;
  locationName?: string;
  showImages?: boolean;
  showPagination?: boolean;
}

export default function NewsSection({
  region,
  locationName,
  showImages = false,
  showPagination = false,
}: NewsSectionProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const [page, setPage] = useState(1);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setIsTimeout(false);
      const API_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const targetRegion = region || '서울';
      const res = await fetch(
        `${API_URL}/news?region=${encodeURIComponent(
          targetRegion,
        )}&page=${page}&limit=5`,
      );
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await res.json();
      if (data.items) {
        setNews(data.items);
      }
    } catch {
      // 에러는 타임아웃으로 처리됨
    } finally {
      setLoading(false);
    }
  }, [region, page]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // 10초 타임아웃 처리
  useEffect(() => {
    if (!loading) return;

    const timeoutId = setTimeout(() => {
      if (loading) {
        setIsTimeout(true);
        setLoading(false);
      }
    }, 10000); // 10초

    return () => clearTimeout(timeoutId);
  }, [loading]);

  const handleRetry = () => {
    fetchNews();
  };

  // 타임아웃 또는 에러 시 표시할 UI
  if (isTimeout || (!loading && news.length === 0)) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="py-12 text-center bg-slate-50 rounded-xl">
          <p className="text-slate-400 text-caption mb-3">
            {isTimeout
              ? '뉴스를 불러오는 데 시간이 너무 오래 걸립니다.'
              : '관련 뉴스가 없습니다.'}
          </p>
          {isTimeout && (
            <button
              onClick={handleRetry}
              className="text-caption text-blue-500 hover:underline font-medium"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-32 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="flex flex-col justify-between mb-8">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="block pb-4">
              <div className="flex gap-4">
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Title Skeleton */}
                  <div className="h-5 w-3/4 bg-slate-200 animate-pulse rounded mb-2" />
                  {/* Description Skeleton */}
                  <div className="h-4 w-full bg-slate-200 animate-pulse rounded mb-1" />
                  <div className="h-4 w-2/3 bg-slate-200 animate-pulse rounded mb-3" />
                  {/* Date Skeleton */}
                  <div className="mt-auto h-3 w-20 bg-slate-200 animate-pulse rounded" />
                </div>

                {showImages && (
                  <div className="shrink-0 w-24 h-24 rounded-xl bg-slate-200 animate-pulse border border-slate-200" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayTitle = locationName || region;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-h2">
          {displayTitle ? `${displayTitle} ` : ''}상권 뉴스
        </h2>
      </div>
      <div className="flex flex-col justify-between">
        {news.map((item, index) => (
          <a
            key={index}
            href={item.link}
            target="_blank"
            rel="nooper noreferrer"
            className="block h-full group pb-2.5"
          >
            <div className="group cursor-pointer flex gap-2">
              <div className="flex-1 min-w-0 flex flex-col">
                <h3
                  className="text-body font-strong text-gray-900 group-hover:text-info transition-colors line-clamp-1"
                  dangerouslySetInnerHTML={{ __html: item.title }}
                />
                <p
                  className="text-gray-600 text-caption mb-2 line-clamp-1 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
                <div className="mt-auto text-caption text-gray-400">
                  {new Date(item.pubDate).toLocaleDateString()}
                </div>
              </div>

              {showImages && item.image && (
                <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={item.image}
                    alt="뉴스 썸네일"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </a>
        ))}
      </div>

      {showPagination && (
        <div className="flex justify-center items-center gap-4 mt-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              page === 1
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            이전
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={news.length === 0}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
