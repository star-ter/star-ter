'use client';

import { useState, useEffect } from 'react';
import { Activity, Store, TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketAnalytics } from './types';
import { MAJOR_CATEGORIES } from './constants/category';
import { useVitalityData } from './hooks';

interface AnalysisContentProps {
  analytics: MarketAnalytics | null;
  regionCode?: string;
  /** 카테고리 선택 변경 시 호출되는 콜백 (지도에 점포 표시용) */
  onCategoryChange?: (categoryCode: string) => void;
}

import { formatRevenue } from './utils';

/**
 * 【리팩토링: 커스텀 훅 사용】
 *
 * Before: 컴포넌트 내부에 useState + useEffect + fetch 로직이 있었음
 * After: useVitalityData 훅으로 분리하여 컴포넌트가 더 깔끔해짐
 *
 * 장점:
 * 1. 컴포넌트는 UI 렌더링에만 집중
 * 2. 데이터 fetch 로직은 재사용 가능
 * 3. 테스트 용이성 향상
 */
export function AnalysisContent({
  analytics,
  regionCode,
  onCategoryChange,
}: AnalysisContentProps) {
  // 선택된 대분류 탭
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // 【커스텀 훅 사용】 개폐업 데이터 fetch 로직이 훅으로 분리됨
  const { vitality, loading: vitalityLoading } = useVitalityData(
    regionCode,
    selectedCategory,
  );

  // 카테고리 변경 시 부모에 알림
  useEffect(() => {
    onCategoryChange?.(selectedCategory);
  }, [selectedCategory, onCategoryChange]);

  // 섹터 데이터 가공
  const sectors = analytics?.sectors || [];
  const totalRevenue = sectors.reduce((sum, s) => sum + s.value, 0);
  const sortedSectors = [...sectors]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 순증감 계산
  const netChange = vitality
    ? vitality.opbizStoreCount - vitality.clsbizStoreCount
    : 0;

  return (
    <div className="space-y-6">
      {/* 업종별 개업/폐업 현황 섹션 */}
      <div className="grid gap-4">
        <h2 className="text-h2 font-bold text-foreground">
          업종별 개업 / 폐업 현황
        </h2>
        <div className="flex flex-wrap gap-2">
          {MAJOR_CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              onClick={() => setSelectedCategory(cat.code)}
              className={`px-4 py-2 mb-2 rounded-xl text-body font-strong transition-all duration-200 ${
                selectedCategory === cat.code
                  ? 'bg-primary text-white font-bold shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              {cat.code === 'ALL' && <span className="mr-1">●</span>}
              {cat.name}
            </button>
          ))}
          {/* 두 카드 레이아웃 */}
          {vitalityLoading ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {/* 시장 활성도 카드 스켈레톤 */}
              <div className="w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                {/* 헤더 */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-slate-100" />
                  <div className="h-6 w-24 rounded bg-slate-100" />
                  <div className="h-5 w-20 rounded-full bg-slate-100" />
                </div>
                {/* 개업/폐업 숫자 영역 */}
                <div className="flex justify-between items-end mb-5 px-1">
                  <div className="space-y-2">
                    <div className="h-8 w-20 rounded bg-slate-100" />
                    <div className="h-5 w-16 rounded bg-slate-100" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-8 w-20 rounded bg-slate-100 ml-auto" />
                    <div className="h-5 w-16 rounded bg-slate-100 ml-auto" />
                  </div>
                </div>
                {/* 비교 바 */}
                <div className="h-3 bg-slate-100 rounded-full mb-5" />
                {/* 결론 메시지 */}
                <div className="py-4 px-4 bg-gray-50 rounded-lg">
                  <div className="h-5 w-48 rounded bg-slate-100 mx-auto" />
                </div>
              </div>

              {/* 경쟁 밀집도 카드 스켈레톤 */}
              <div className="w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  {/* 헤더 */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-slate-100" />
                    <div className="h-6 w-24 rounded bg-slate-100" />
                    <div className="h-5 w-20 rounded-full bg-slate-100" />
                  </div>
                  {/* 아이콘 + 숫자 영역 */}
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100" />
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded bg-slate-100" />
                      <div className="h-10 w-24 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
                {/* 하단 정보 박스 */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="h-5 w-full rounded bg-slate-100 mb-2" />
                  <div className="h-5 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ) : vitality ? (
            <div className="w-full flex justify-between md:grid-cols-2 gap-4">
              {/* 시장 활성도 카드 (개업 VS 폐업) */}
              <div className="w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full border-primary flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-h3 font-bold text-foreground">
                    시장 활성도
                  </h3>
                  <span className="text-caption font-medium text-foreground bg-muted px-2 py-1 rounded-full">
                    개업 VS 폐업
                  </span>
                </div>

                <div className="flex justify-between items-end mb-5 px-1">
                  {/* 개업 */}
                  <div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-h2 font-heading text-success tracking-tight">
                        {vitality.opbizStoreCount.toLocaleString()}
                      </span>
                      <span className="text-gray-500 font-medium text-caption">
                        개소
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-strong text-success bg-success/10 px-2 py-0.5 rounded-md">
                        개업
                      </span>
                      <span className="text-muted-foreground text-body">
                        {vitality.opbizRt.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* 폐업 */}
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end mb-1">
                      <span className="text-h2 font-heading text-danger tracking-tight">
                        {vitality.clsbizStoreCount.toLocaleString()}
                      </span>
                      <span className="text-gray-500 font-medium text-caption">
                        개소
                      </span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-body font-strong text-danger bg-danger/10 px-2 py-0.5 rounded-md">
                        폐업
                      </span>
                      <span className="text-muted-foreground text-body">
                        {vitality.clsbizRt.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 비교 바 */}
                <div className="h-4 bg-muted rounded-full overflow-hidden flex mb-5 ring-1 ring-muted">
                  <div
                    className="h-full bg-success"
                    style={{
                      width: `${(vitality.opbizStoreCount / (vitality.opbizStoreCount + vitality.clsbizStoreCount + 0.001)) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="h-full bg-danger"
                    style={{
                      width: `${(vitality.clsbizStoreCount / (vitality.opbizStoreCount + vitality.clsbizStoreCount + 0.001)) * 100}%`,
                    }}
                  ></div>
                </div>

                {/* 결론 메시지 */}
                <div className="py-4 px-4 bg-muted/50 rounded-lg text-center">
                  {netChange >= 0 ? (
                    <p className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                      <span className="text-h5 font-strong text-foreground">
                        성장하는 시장입니다
                      </span>
                      <span className="text-muted-foreground text-body font-medium">
                        (진입 추천)
                      </span>
                    </p>
                  ) : (
                    <p className="flex items-center justify-center gap-2">
                      <TrendingDown className="w-5 h-5 text-danger" />
                      <span className="text-h5 font-strong text-foreground">
                        위축되는 시장입니다
                      </span>
                      <span className="text-muted-foreground text-body font-medium">
                        (주의 필요)
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* 경쟁 밀집도 카드 (점포수 증감) */}
              <div className="w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-h3 text-foreground">
                      경쟁 밀집도
                    </h3>
                    <span className="text-caption font-medium text-foreground bg-muted px-2 py-1 rounded-full">
                      점포수 증감
                    </span>
                  </div>

                  <div className="flex items-center gap-5 mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border ${
                        netChange >= 0
                          ? 'bg-success/5 border-success/20'
                          : 'bg-danger/5 border-danger/20'
                      }`}
                    >
                      {netChange >= 0 ? (
                        <TrendingUp className="w-8 h-8 text-success" />
                      ) : (
                        <TrendingDown className="w-8 h-8 text-danger" />
                      )}
                    </div>
                    <div>
                      <p className="text-body font-strong text-muted-foreground mb-1">
                        신규 - 폐업 (순증감)
                      </p>
                      <div className="flex items-baseline gap-1">
                        <p
                          className={`text-h2 font-heading tracking-tight ${
                            netChange >= 0 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {netChange > 0 ? '+' : ''}
                          {netChange.toLocaleString()}
                        </p>
                        <span className="text-caption font-strong text-gray-400">
                          개
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-gray-800 font-strong text-body leading-relaxed">
                    지난 분기 동안 지난 분기 동안{' '}
                    <span className="font-bold text-success">
                      {vitality.opbizStoreCount.toLocaleString()}개
                    </span>
                    가 새로 생기고,
                    <br />
                    <span className="font-bold text-danger">
                      {vitality.clsbizStoreCount.toLocaleString()}개
                    </span>
                    가 문을 닫았습니다.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-body">개폐업 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 업종별 매출 분석 섹션 */}

      <div className="grid gap-4">
        <h2 className="text-h2 font-bold text-foreground">업종별 매출 분석</h2>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
          {sortedSectors.length > 0 ? (
            <div className="space-y-4">
              {sortedSectors.map((item) => {
                const share =
                  totalRevenue > 0
                    ? Math.round((item.value / totalRevenue) * 100)
                    : 0;
                // 최대 매출 업종 강조 (Info Blue), 그 외에는 Primary Navy
                const maxSales = Math.max(...sortedSectors.map((s) => s.value));
                const isMax = item.value === maxSales;
                const colorClass = isMax ? 'bg-info' : 'bg-primary';

                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${colorClass}`}
                        />
                        <span className="font-strong text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-strong text-foreground">
                          {formatRevenue(item.value)}
                        </span>
                        <span className="text-caption font-bold text-gray-500 ml-2">
                          ({share}%)
                        </span>
                      </div>
                    </div>
                    <div className="bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* 총 매출 표시 */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-body font-medium">
                    총 매출
                  </span>
                  <span className="text-h5 font-heading text-foreground">
                    {formatRevenue(totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              매출 데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 업종별 포화도 섹션 (있을 경우) */}
      {analytics?.saturation && analytics.saturation.length > 0 && (
        <div className="grid gap-4">
          <h2 className="text-h2 font-bold text-foreground">
            업종별 경쟁 강도
          </h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
            <div className="grid grid-cols-2 gap-3">
              {analytics.saturation.slice(0, 4).map((item) => {
                const statusColor =
                  {
                    위험: 'bg-danger text-white',
                    경계: 'bg-accent text-white',
                    추천: 'bg-success text-white',
                  }[item.status] || 'bg-gray-500 text-white';

                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 bg-muted rounded-xl"
                  >
                    <span className="text-h4 font-bold text-foreground p-4">
                      {item.name}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-caption font-bold ${statusColor}`}
                    >
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
