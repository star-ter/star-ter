'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { Settings2 } from 'lucide-react';
import {
  getRecommendations,
  ScoredLocation,
} from '@/services/location/locationRecommend.service';
import { getOnboarding, getPersonalization, updateOnboarding } from '@/services/user/user.api';
import { useUserStore } from '@/store/use-user-store';
import { useRecommendStore } from '@/store/use-recommend-store';
import { PentagonChart } from '@/components/charts/PentagonChart';
import { StartupPreferencesPopup } from '@/components/StartupPreferencesPopup';
import type { OnboardingData } from '@/components/onboarding/onboarding-options';

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
      badgeColor: 'bg-success',
      textColor: 'text-success',
      chartColor: 'var(--success)',
    };
  if (score >= 70)
    return {
      text: '추천',
      badgeColor: 'bg-info',
      textColor: 'text-info',
      chartColor: 'var(--info)',
    };
  if (score >= 50)
    return {
      text: '적합',
      badgeColor: 'bg-primary',
      textColor: 'text-primary',
      chartColor: 'var(--primary)',
    };
  return {
    text: '참고',
    badgeColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    chartColor: 'var(--muted-foreground)',
  };
};

export function RecommendSection() {
  const authUser = useUserStore((state) => state.authUser);
  const { recommendResult, isLoaded, clearRecommendResult } =
    useRecommendStore();
  const [recommendedLocations, setRecommendedLocations] = useState<
    ScoredLocation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const prefetchConsumed = useRef(false);
  const [refreshToken, setRefreshToken] = useState(0); // 추천 새로고침용

  // 설정 팝업 관련 상태
  const [isMounted, setIsMounted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [preferencesData, setPreferencesData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenPopup = async () => {
    setPrefsError(null);
    setIsLoadingPrefs(true);
    setShowPopup(true);
    try {
      const data = await getPersonalization();
      setPreferencesData(data);
    } catch {
      setPreferencesData(null);
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  const handleSavePreferences = async (data: OnboardingData) => {
    setIsSaving(true);
    setPrefsError(null);
    try {
      await updateOnboarding(data);
      setPreferencesData(data);
      setShowPopup(false);
      // 저장 후 추천 다시 불러오기 (새로고침 없이)
      prefetchConsumed.current = false;
      setRefreshToken((prev) => prev + 1);
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!authUser) {
      setRecommendedLocations([]);
      setIsLoading(false);
      return;
    }

    // refreshToken이 변경되면 pre-fetch 무시하고 새로 fetch
    if (refreshToken > 0) {
      fetchRecommendations();
      return;
    }

    // 스토어에 pre-fetched 데이터가 있고, 아직 사용하지 않은 경우
    if (isLoaded && recommendResult && !prefetchConsumed.current) {
      prefetchConsumed.current = true;
      setRecommendedLocations(recommendResult.locations.slice(0, 5));
      setIsLoading(false);
      clearRecommendResult(); // 스토어 클리어
      return;
    }

    // 이미 pre-fetch 데이터를 사용했거나, 스토어에 데이터가 없는 경우 fetch
    if (prefetchConsumed.current && refreshToken === 0) {
      return; // 이미 데이터 있음
    }

    async function fetchRecommendations() {
      setIsLoading(true);
      try {
        const onboarding = await getOnboarding();
        if (!onboarding || !onboarding.completed || !onboarding.age) {
          setNeedsOnboarding(true);
          return;
        }

        const response = await getRecommendations({
          age: onboarding.age,
          region: onboarding.region!,
          operatingTime: onboarding.operatingTime!,
          capital: onboarding.capital!,
          industryCode: onboarding.industryCode,
        });

        if (response) {
          setRecommendedLocations(response.locations.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecommendations();
  }, [authUser, isLoaded, recommendResult, clearRecommendResult, refreshToken]);

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
          ...(location.scores.industry !== null
            ? [
                {
                  label: '업종 적합',
                  value: Math.round(location.scores.industry * 100),
                },
              ]
            : []),
        ],
        href: `/locations/detail/${location.id}`,
      }));
    }
    return [];
  }, [recommendedLocations]);

  // 로그인 안됨
  if (!authUser) {
    return (
      <section className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-heading text-foreground">
            사장님께 추천하는 상권
          </h2>
          <Link
            href="/locations/search?tab=맞춤 추천"
            className="text-body font-strong text-muted-foreground hover:text-foreground transition-colors"
          >
            더보기 &gt;
          </Link>
        </div>
        <div className="bg-muted/30 rounded-2xl p-6 border border-border flex flex-col items-center justify-center py-12 text-center">
          <p className="text-body text-foreground mb-1 font-bold">
            로그인이 필요한 서비스입니다.
          </p>
          <p className="text-caption text-muted-foreground mb-4">
            로그인하고 나에게 딱 맞는 상권을 추천받아보세요!
          </p>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </section>
    );
  }

  // 온보딩 미완료 시
  if (needsOnboarding) {
    return (
      <section className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-heading text-foreground">
            {authUser?.nickname ? `${authUser.nickname}님` : '사장님'}께 추천하는
            상권
          </h2>
          <Link
            href="/locations/search?tab=맞춤 추천"
            className="text-body font-strong text-muted-foreground hover:text-foreground transition-colors"
          >
            더보기 &gt;
          </Link>
        </div>
        <div className="bg-muted/30 rounded-2xl p-6 border border-border flex flex-col items-center justify-center py-12 text-center">
          <p className="text-body text-foreground mb-1 font-bold">
            아직 맞춤 정보를 입력하지 않으셨네요!
          </p>
          <p className="text-caption text-muted-foreground mb-4">
            간단한 설문을 완료하면 사장님께 딱 맞는 상권을 추천해드려요.
          </p>
          <Link
            href="/onboarding/intro"
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            맞춤 정보 입력하기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
    <section className="px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-h3 font-heading text-foreground">
            {authUser?.nickname ? `${authUser.nickname}님` : '사장님'}께 추천하는
            상권
          </h2>
          {/* 설정 버튼 */}
          <button
            onClick={handleOpenPopup}
            className="w-9 h-9 rounded-xl bg-muted border border-border hover:bg-primary/10 hover:border-primary/30 flex items-center justify-center transition-all"
            title="창업 조건 설정"
          >
            <Settings2 className="w-4.5 h-4.5 text-muted-foreground" />
          </button>
        </div>
        <Link
          href="/locations/search?tab=맞춤 추천"
          className="text-body font-strong text-muted-foreground hover:text-foreground transition-colors"
        >
          더보기 &gt;
        </Link>
      </div>

      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-5">
          {isLoading || displayLocations.length === 0
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="w-96 shrink-0 rounded-2xl bg-background shadow-sm border border-border p-6 animate-pulse flex flex-col justify-between h-96"
                >
                  <div className="space-y-3">
                    <div className="h-5 w-16 rounded-full bg-muted" />
                    <div className="h-5 w-40 rounded bg-muted" />
                    <div className="h-4 w-24 rounded bg-muted" />
                  </div>
                  <div className="flex items-end justify-between gap-6">
                    <div>
                      <div className="mb-3 h-3 w-14 rounded bg-muted" />
                      <div className="flex items-end gap-2">
                        <div className="h-8 w-16 rounded bg-muted" />
                        <div className="h-4 w-6 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-40 w-40 rounded-full bg-muted" />
                  </div>
                </div>
              ))
            : displayLocations.map((location) => {
                const badge = getScoreBadge(location.score);
                return (
                  <Link
                    key={location.id}
                    href={location.href}
                    className="w-96 shrink-0 rounded-2xl bg-background shadow-sm border border-border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-96"
                  >
                    <div className="space-y-1.5">
                      <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-tiny font-heading text-white ${badge.badgeColor}`}
                      >
                        {badge.text}
                      </div>
                      <h3 className="mt-2 text-h4 font-heading text-foreground">
                        {location.name}
                      </h3>
                      <p className="text-h5 font-strong text-muted-foreground">
                        {location.region}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-6">
                      <div>
                        <p className="text-caption font-strong text-muted-foreground mb-1">
                          매칭 점수
                        </p>
                        <div className="flex items-end gap-1">
                          <span
                            className={`text-h1 font-heading ${badge.textColor}`}
                          >
                            {formatScore(location.score)}
                          </span>
                          <span
                            className={`text-h5 font-heading ${badge.textColor}`}
                          >
                            점
                          </span>
                        </div>
                      </div>

                      <div className="relative right-6">
                        <PentagonChart
                          metrics={location.metrics}
                          size={200}
                          color={badge.chartColor}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>

    {/* 창업 조건 설정 팝업 */}
    {isMounted &&
      createPortal(
        <AnimatePresence>
          {showPopup && (
            <StartupPreferencesPopup
              initialData={preferencesData ?? undefined}
              onClose={() => setShowPopup(false)}
              onSave={handleSavePreferences}
              isSaving={isSaving}
              isLoading={isLoadingPrefs}
              error={prefsError}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
