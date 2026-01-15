'use client';

import Link from 'next/link';
import { LocationCardData } from './types';

const BADGE_STYLES = {
  growth: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
  },
  stable: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
  },
  recommend: {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
  },
};

interface LocationCardProps {
  data: LocationCardData;
}

export function LocationCard({ data }: LocationCardProps) {
  const style = BADGE_STYLES[data.badgeType];

  return (
    <Link
      href={`/locations/detail/${data.code}`}
      className="w-72 shrink-0 rounded-2xl bg-white shadow-sm border border-slate-100 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col"
    >
      {/* 배지 */}
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${style.bg} w-fit mb-2`}
      >
        {data.badge}
      </span>

      {/* 이름 */}
      <h4 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">
        {data.name}
      </h4>

      {/* 메트릭 */}
      <div className="mt-auto pt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-slate-400">
            {data.primaryLabel}
          </span>
          <span className={`text-lg font-black ${style.text}`}>
            {data.primaryValue}
          </span>
        </div>
        {data.secondaryValue && (
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-400">
              {data.secondaryLabel}
            </span>
            <span className="text-sm font-bold text-slate-600">
              {data.secondaryValue}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
