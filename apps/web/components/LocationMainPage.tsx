'use client';

import { RecommendSection } from '@/components/location-main-page/RecommendSection';
import { TrendingSection } from '@/components/location-main-page/TrendingSection';
import { AverageSalesSection } from '@/components/location-main-page/AverageSalesSection';

import { useUserStore } from '@/store/use-user-store';

export function LocationListPage() {
  const { authUser } = useUserStore();

  return (
    <div className="flex flex-1 overflow-y-auto flex-col h-full bg-white rounded-2xl shadow-lg overflow-hidden no-scrollbar">
      {/* 인사말 헤더 + 검색 */}
      <div className="px-8 pt-6 pb-4 shrink-0">
        <h1 className="text-h1 font-heading text-slate-900 mb-1">
          안녕하세요, {authUser?.nickname ? `${authUser.nickname}님` : '사장님'}
        </h1>
        <p className="text-h5 text-slate-400 mb-4">
          오늘은 어떤 상권을 찾고 계신가요?
        </p>
      </div>

      {/* 섹션들 */}
      <RecommendSection />
      <AverageSalesSection />
      <TrendingSection />
    </div>
  );
}

'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  getRecommendations,
  ScoredLocation,
} from '@/services/location/locationRecommend.service';
import { getOnboarding } from '@/services/user/user.api';
import { useUserStore } from '@/store/use-user-store';

type DisplayLocation = {
  id: string;
  name: string;
  region: string;
  score: number;
  metrics: { label: string; value: number }[];
  href: string;
};

const formatScore = (score: number) =>
  Number.isInteger(score) ? `${score}` : score.toFixed(1);

const getScoreBadge = (score: number) => {
  if (score >= 90)
    return {
      text: '최적 매칭',
      badgeColor: 'bg-emerald-500',
      textColor: 'text-emerald-500',
    };
  if (score >= 70)
    return {
      text: '추천',
      badgeColor: 'bg-blue-500',
      textColor: 'text-blue-500',
    };
  if (score >= 50)
    return {
      text: '적합',
      badgeColor: 'bg-amber-500',
      textColor: 'text-amber-500',
    };
  return {
    text: '참고',
    badgeColor: 'bg-slate-400',
    textColor: 'text-slate-400',
  };
};

export function LocationListPage() {
  const authUser = useUserStore((state) => state.authUser);
  const pathname = usePathname();
  const [recommendedLocations, setRecommendedLocations] = useState<
    ScoredLocation[]
  >([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(true);
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  const isLoggedIn = Boolean(authUser);
  const loginHref = pathname
    ? `/login?next=${encodeURIComponent(pathname)}`
    : '/login';

  useEffect(() => {
    if (!isLoggedIn) {
      setRecommendedLocations([]);
      setIsLoadingRecommendations(false);
      return;
    }

    async function fetchRecommendations() {
      setIsLoadingRecommendations(true);
      try {
        const onboarding = await getOnboarding();
        if (!onboarding || !onboarding.completed) return;
        if (
          !onboarding.age ||
          !onboarding.region ||
          !onboarding.operatingTime ||
          !onboarding.capital
        )
          return;

        const response = await getRecommendations({
          age: onboarding.age,
          region: onboarding.region,
          operatingTime: onboarding.operatingTime,
          capital: onboarding.capital,
        });

        if (response) {
          setRecommendedLocations(response.locations.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    }
    fetchRecommendations();
  }, [isLoggedIn]);

  useEffect(() => {
    const textarea = chatInputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const minHeight = 24;
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      200,
    );
    textarea.style.height = `${nextHeight}px`;
  }, [chatInput]);

  const displayLocations: DisplayLocation[] = useMemo(() => {
    if (recommendedLocations.length > 0) {
      return recommendedLocations.map((location) => ({
        id: location.id,
        name: location.name,
        region: '서울',
        score: location.totalScore,
        metrics: [
          { label: '타깃 연령', value: Math.round(location.scores.age * 100) },
          { label: '창업 비용', value: Math.round(location.scores.rent * 100) },
          {
            label: '상권 테마',
            value: Math.round(location.scores.region * 100),
          },
          { label: '운영 시간', value: Math.round(location.scores.time * 100) },
        ],
        href: `/locations/detail/${location.id}`,
      }));
    }

    return [];
  }, [recommendedLocations]);

  return (
    <div className="relative flex min-h-full flex-col bg-[#f7f7f8]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pt-2 pb-32">
        <div className="text-center mb-10">
          {isLoggedIn ? (
            <>
              <h1 className="text-[34px] font-black text-slate-900">
                사용자님에게 가장 적합한 상권
              </h1>
              <p className="mt-3 text-base text-slate-400">
                데이터 분석을 통해 도출된 최적의 추천 리스트입니다
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[34px] font-black text-slate-900">
                추천 상권을 받아보세요
              </h1>
              <p className="mt-3 text-base text-slate-400">
                추천 상권을 받으려면{' '}
                <Link
                  href={loginHref}
                  className="font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-900"
                >
                  로그인
                </Link>
                해주세요
              </p>
            </>
          )}
        </div>

        <div className="flex justify-center">
          <div className="inline-grid grid-cols-1 gap-6 md:grid-cols-3">
            {isLoadingRecommendations || displayLocations.length === 0
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="w-[min(320px,90vw)] h-[280px] rounded-[28px] bg-white shadow-sm border border-slate-100 p-7 animate-pulse flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="h-5 w-16 rounded-full bg-slate-100" />
                      <div className="h-5 w-40 rounded bg-slate-100" />
                      <div className="h-4 w-24 rounded bg-slate-100" />
                    </div>

                    <div className="flex items-end justify-between gap-6">
                      <div>
                        <div className="mb-3 h-3 w-14 rounded bg-slate-100" />
                        <div className="flex items-end gap-2">
                          <div className="h-8 w-16 rounded bg-slate-100" />
                          <div className="h-4 w-6 rounded bg-slate-100" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((__, metricIndex) => (
                          <div
                            key={`metric-${index}-${metricIndex}`}
                            className="flex items-center justify-between gap-6"
                          >
                            <div className="h-3 w-16 rounded bg-slate-100" />
                            <div className="h-3 w-10 rounded bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              : displayLocations.map((location) => {
                  const badge = getScoreBadge(location.score);
                  return (
                    <Link
                      key={location.id}
                      href={location.href}
                      className="w-[min(320px,90vw)] h-[280px] rounded-[28px] bg-white shadow-sm border border-slate-100 p-7 transition-transform duration-200 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold text-white ${badge.badgeColor}`}
                        >
                          {badge.text}
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">
                          {location.name}
                        </h3>
                        <p className="text-sm font-semibold text-slate-400">
                          {location.region}
                        </p>
                      </div>

                      <div className="flex items-end justify-between gap-6">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 mb-2">
                            매칭 점수
                          </p>
                          <div className="flex items-end gap-1">
                            <span
                              className={`text-3xl font-black ${badge.textColor}`}
                            >
                              {formatScore(location.score)}
                            </span>
                            <span
                              className={`text-sm font-bold ${badge.textColor}`}
                            >
                              점
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs font-semibold text-slate-400">
                          {location.metrics.map((metric) => (
                            <div
                              key={metric.label}
                              className="flex items-center justify-between gap-6"
                            >
                              <span>{metric.label}</span>
                              <span className="text-slate-600 font-bold">
                                {metric.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-8 z-20 w-[min(320px,90vw)] md:w-[min(1008px,90vw)] -translate-x-1/2"
        style={{
          left: 'calc(50% + var(--sidebar-offset, 0px) / 2)',
          transition: 'left 300ms ease',
        }}
      >
        <div className="relative rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="무엇이든 물어보세요"
            rows={1}
            className="w-full min-h-[24px] resize-none bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none leading-6 pr-14"
            aria-label="채팅 입력"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
              }
            }}
          />
          <button
            type="button"
            className="absolute right-4 bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white"
            aria-label="전송"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
