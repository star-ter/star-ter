'use client';

export function MatchingContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-48 bg-slate-200 rounded" />
      </div>

      {/* 첫 번째 행: 타깃 연령 + 상권 테마 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 타깃 연령 스켈레톤 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between mb-4">
            <div className="h-5 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
          <div className="h-4 w-32 bg-slate-200 rounded mb-6" />
          <div className="flex justify-center mb-6">
            <div className="w-40 h-40 bg-slate-200 rounded-full" />
          </div>
          <div className="flex justify-center gap-4 mb-6">
            <div className="h-4 w-16 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-5 w-32 bg-slate-200 rounded" />
          </div>
        </div>

        {/* 상권 테마 스켈레톤 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between mb-4">
            <div className="h-5 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
          <div className="h-4 w-32 bg-slate-200 rounded mb-6" />
          <div className="bg-slate-100 rounded-xl p-4 mb-4">
            <div className="h-6 w-20 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 운영 시간 스켈레톤 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex justify-between mb-4">
          <div className="h-5 w-24 bg-slate-200 rounded" />
          <div className="h-8 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-4 w-32 bg-slate-200 rounded mb-6" />
        <div className="flex justify-between gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="h-4 w-12 bg-slate-200 rounded mb-2" />
              <div className="w-full h-32 bg-slate-200 rounded-lg" />
              <div className="h-4 w-12 bg-slate-200 rounded mt-2" />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-between">
          <div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-5 w-40 bg-slate-200 rounded" />
          </div>
          <div className="h-8 w-16 bg-slate-200 rounded" />
        </div>
      </div>

      {/* 두 번째 행: 창업 비용 + 업종 적합도 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 창업 비용 스켈레톤 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between mb-4">
            <div className="h-5 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
          <div className="h-4 w-40 bg-slate-200 rounded mb-6" />
          <div className="flex justify-center gap-12 mb-6">
            <div className="flex flex-col items-center">
              <div className="h-4 w-16 bg-slate-200 rounded mb-2" />
              <div className="w-20 h-40 bg-slate-200 rounded-lg" />
              <div className="h-4 w-20 bg-slate-200 rounded mt-2" />
            </div>
            <div className="flex flex-col items-center">
              <div className="h-4 w-16 bg-slate-200 rounded mb-2" />
              <div className="w-20 h-40 bg-slate-200 rounded-lg" />
              <div className="h-4 w-20 bg-slate-200 rounded mt-2" />
            </div>
          </div>
        </div>

        {/* 업종 적합도 스켈레톤 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between mb-4">
            <div className="h-5 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
          <div className="h-4 w-40 bg-slate-200 rounded mb-8" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-10 w-12 bg-slate-200 rounded" />
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-10 w-12 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="h-4 w-full bg-slate-200 rounded" />
          </div>
        </div>
      </div>

      {/* 예상 매출 카드 스켈레톤 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-10 w-48 bg-slate-200 rounded" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-6 w-24 bg-slate-200 rounded" />
            </div>
            <div>
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-6 w-24 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
