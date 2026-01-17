'use client';

import React from 'react';
import { MapPin, Building2, Home, ChevronRight } from 'lucide-react';

/**
 * ListingsCard - 매물 리스트 카드 컴포넌트
 *
 * 차분하고 일관된 디자인 (다른 차트 컴포넌트와 동일한 스타일)
 */

interface ListingItem {
  id: string;
  title: string;
  address: string;
  deposit: number;
  monthlyRent: number;
  size?: number;
  floor?: string;
  distance?: number;
}

interface ListingsData {
  listings: ListingItem[];
  totalCount: number;
  areaName?: string;
}

interface ListingsCardProps {
  data: ListingsData | null;
  isLoading?: boolean;
  areaName?: string;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 100000000) {
    const uk = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `${uk}억 ${man.toLocaleString()}만` : `${uk}억`;
  }
  return `${Math.floor(amount / 10000).toLocaleString()}만`;
};

export function ListingsCard({ data, isLoading, areaName }: ListingsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="flex-1 h-4 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.listings || data.listings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-slate-500">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          <span>조건에 맞는 매물을 찾을 수 없습니다.</span>
        </div>
      </div>
    );
  }

  const { listings, totalCount } = data;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden my-4">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-slate-400" />
            <h3 className="text-body font-strong text-slate-700">
              추천 매물
              {areaName && (
                <span className="text-slate-400 font-medium ml-2">
                  {areaName}
                </span>
              )}
            </h3>
          </div>
          <span className="text-caption text-slate-400">총 {totalCount}건</span>
        </div>
      </div>

      {/* 매물 리스트 */}
      <div className="divide-y divide-slate-100">
        {listings.map((listing, index) => (
          <div
            key={listing.id || index}
            className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-center">
              {/* 왼쪽: 제목 */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="text-body font-medium text-slate-700 truncate">
                    {listing.title || `매물 ${index + 1}`}
                  </div>
                  {listing.distance && (
                    <div className="flex items-center gap-1 text-caption text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{listing.distance}m</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 오른쪽: 가격 정보 */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-body font-bold text-slate-800">
                    {formatCurrency(listing.deposit)} /{' '}
                    {formatCurrency(listing.monthlyRent)}
                  </div>
                  <div className="text-caption text-slate-400">
                    {listing.size && `${listing.size}평`}
                    {listing.size && listing.floor && ' · '}
                    {listing.floor && `${listing.floor}층`}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 더보기 안내 */}
      {totalCount > listings.length && (
        <div className="px-6 py-3 bg-slate-50 text-center text-caption text-slate-500 border-t border-slate-100">
          외 {totalCount - listings.length}건의 매물이 더 있습니다
        </div>
      )}
    </div>
  );
}
