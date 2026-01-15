"use client";

import { ExternalLink } from "lucide-react";

/**
 * SourceCard 컴포넌트 - 출처 정보 카드
 *
 * 작은 단위 컴포넌트:
 * - 단일 책임 원칙: 하나의 출처 정보만 표시
 * - 재사용성: 여러 곳에서 동일한 UI로 사용 가능
 */

interface Source {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  number: number;
}

interface SourceCardProps {
  source: Source;
}

export function SourceCard({ source }: SourceCardProps) {
  // URL에서 도메인 추출
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group min-w-[180px]"
    >
      {/* 파비콘 또는 기본 아이콘 */}
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
        {source.favicon ? (
          <img
            src={source.favicon}
            alt=""
            className="w-4 h-4"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ExternalLink className="w-4 h-4 text-slate-400" />
        )}
      </div>

      {/* 출처 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
          {source.title}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="w-3 h-3 bg-amber-100 rounded-sm flex items-center justify-center">
            <span className="text-[8px] font-bold text-amber-600">★</span>
          </span>
          {getDomain(source.url)} • {source.number}
        </p>
      </div>
    </a>
  );
}

// "+N More" 버튼 컴포넌트
export function SourceMoreButton({ count }: { count: number }) {
  return (
    <button className="flex items-center justify-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all text-sm text-slate-500 font-medium min-w-[100px]">
      +{count} More
    </button>
  );
}
