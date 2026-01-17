'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOnboarding } from '@/services/user/user.api';
import { useUserStore } from '@/store/use-user-store';
import {
  AgeScoreSection,
  RegionScoreSection,
  TimeScoreSection,
  CostScoreSection,
  IndustryScoreSection,
  MatchingContentSkeleton,
  formatMoney,
} from './matching-content';
import type { ScoreData } from './matching-content';

interface MatchingContentProps {
  locationName: string;
  trdarCd: string;
}

export function MatchingContent({
  locationName,
  trdarCd,
}: MatchingContentProps) {
  const authUser = useUserStore((state) => state.authUser);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 1. 로그인 체크 (authUser가 로드될 때까지 기다릴 수도 있지만, 여기선 간단히)
      // useUserStore는 클라이언트 사이드에서 초기화되므로,
      // useEffect 내부에서 authUser 값을 직접 확인하거나,
      // 별도의 useEffect로 분리할 수도 있음.
      // 하지만 여기선 fetchData 호출 시점에 판단.
      if (!authUser) {
        setRequiresLogin(true);
        setLoading(false);
        return;
      }

      try {
        // 2. 온보딩 체크
        const onboarding = await getOnboarding();
        if (
          !onboarding ||
          !onboarding.completed ||
          !onboarding.age ||
          !onboarding.region ||
          !onboarding.operatingTime ||
          !onboarding.capital
        ) {
          setNeedsOnboarding(true);
          setLoading(false);
          return;
        }

        const API_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

        // 통합 API 호출 (점수 + businessMetrics)
        const res = await fetch(`${API_URL}/location-recommend/${trdarCd}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (res.ok) {
          const result = await res.json();
          setScoreData(result);
        }
      } catch (error) {
        console.error('Failed to fetch analysis data', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [trdarCd, authUser]);

  // locationName 사용하지 않아도 lint 경고 방지
  void locationName;

  // businessMetrics에서 데이터 추출
  const metrics = scoreData?.businessMetrics;

  // 로딩 중이면 스켈레톤 표시
  if (loading) {
    return (
      <div className="space-y-10">
        <div className="space-y-6">
          <MatchingContentSkeleton />
        </div>
      </div>
    );
  }

  // 로그인 필요 UI
  if (requiresLogin) {
    return (
      <div className="space-y-10">
        <h2 className="text-h2 font-bold text-slate-900">
          업종 정밀 매칭 결과
        </h2>
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-slate-100">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-h4 font-bold text-slate-900">
            로그인이 필요한 서비스입니다.
          </p>
          <p className="text-body text-slate-500">
            로그인하고 이 상권이 나에게 얼마나 맞는지 확인해보세요!
          </p>
          <Link
            href="/login"
            className="mt-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  // 온보딩 필요 UI
  if (needsOnboarding) {
    return (
      <div className="space-y-10">
        <h2 className="text-h2 font-bold text-slate-900">
          업종 정밀 매칭 결과
        </h2>
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-slate-100">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <p className="text-h4 font-bold text-slate-900">
            아직 맞춤 정보를 입력하지 않으셨네요!
          </p>
          <p className="text-body text-slate-500">
            간단한 설문을 완료하면 이 상권과의 매칭 점수를 분석해드려요.
          </p>
          <Link
            href="/onboarding/intro"
            className="mt-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            맞춤 정보 입력하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-h2 font-bold text-slate-900">
          업종 정밀 매칭 결과
        </h2>

        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
          {scoreData && scoreData.totalScore > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-10">
              {(() => {
                const getScoreContent = (score: number) => {
                  switch (true) {
                    case score >= 91:
                      return {
                        title: '"여기가 바로 명당입니다!"',
                        desc: '데이터가 증명하는 최적의 입지입니다. 사장님을 위해 준비된 기회를 놓치지 마세요.',
                        color: 'text-success',
                      };
                    case score >= 80:
                      return {
                        title: '"성공 예감이 드는 곳입니다!"',
                        desc: '매 매우 훌륭한 매칭 점수입니다. 안정적인 수익 창출이 기대되는 매력적인 상권입니다.',
                        color: 'text-success',
                      };
                    case score >= 70:
                      return {
                        title: '"긍정적인 신호가 가득해요"',
                        desc: '상권 데이터가 사장님에게 호의적입니다. 좋은 기회가 될 수 있으니 적극적으로 검토해보세요.',
                        color: 'text-gender-male',
                      };
                    case score >= 51:
                      return {
                        title: '"안정적인 평균 수준입니다"',
                        desc: '무난한 선택지입니다. 차별화된 마케팅과 서비스로 승부한다면 충분히 좋은 성과를 낼 수 있습니다.',
                        color: 'text-accent',
                      };
                    case score >= 31:
                      return {
                        title: '"가능성이 보이는 상권입니다"',
                        desc: '나쁘지 않은 조건이지만, 확실한 성공을 위해서는 이 상권만의 공략 포인트가 필요합니다.',
                        color: 'text-accent',
                      };
                    case score >= 21:
                      return {
                        title: '"신중한 재검토가 필요합니다"',
                        desc: '성공적인 창업을 위해서는 더 많은 준비가 필요해 보입니다. 리스크를 줄이기 위한 방안을 모색해보세요.',
                        color: 'text-danger',
                      };
                    default:
                      return {
                        title: '"새로운 전략이 필요해요"',
                        desc: '현재 데이터로는 높은 경쟁력을 기대하기 어렵습니다. 다른 지역이나 업종도 함께 고려해보시는 것을 추천합니다.',
                        color: 'text-danger',
                      };
                  }
                };

                const content = getScoreContent(scoreData.totalScore);

                return (
                  <>
                    <div className="relative shrink-0">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="transparent"
                          className="text-slate-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={364}
                          strokeDashoffset={
                            364 * (1 - scoreData.totalScore / 100)
                          }
                          className={content.color}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-h3 font-heading text-slate-900">
                          {scoreData.totalScore}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 text-center lg:text-left">
                      <h3
                        className={`text-h3 font-heading leading-tight ${content.color}`}
                      >
                        {content.title}
                      </h3>
                      <p className="text-slate-500 text-body leading-relaxed break-keep">
                        {content.desc}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <p className="text-slate-400 font-bold">
                매칭 점수를 분석하고 있습니다...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 점수 설명 섹션 - 시각화된 비교 */}
      {scoreData && (
        <div className="space-y-4">
          <h2 className="text-h2 font-bold text-slate-900">
            사장님 맞춤 분석 결과
          </h2>
          <div className="space-y-4">
            {/* 타깃 연령 + 상권 테마 (같은 row) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AgeScoreSection
                score={scoreData.scores.age}
                userAge={scoreData.userPreferences.age}
              />
              <RegionScoreSection
                score={scoreData.scores.region}
                userRegion={scoreData.userPreferences.region}
              />
            </div>

            {/* 운영 시간 */}
            <TimeScoreSection
              score={scoreData.scores.time}
              userOperatingTime={scoreData.userPreferences.operatingTime}
            />

            {/* 창업 비용 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CostScoreSection
                score={scoreData.scores.rent}
                userCapital={scoreData.userPreferences.capital}
                actualDeposit={metrics?.startupCost?.deposit || 0}
                actualRent={metrics?.startupCost?.monthlyRent || 0}
              />

              {/* 업종 적합도 */}
              {scoreData.scores.industry && (
                <IndustryScoreSection
                  score={scoreData.scores.industry}
                  industryName={metrics?.appliedIndustryName || '업종 선택됨'}
                  competitorCount={metrics?.competitorCount || 0}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-slate-400 font-bold text-caption uppercase tracking-wider">
                상권 내 {metrics?.appliedIndustryName || '선택 업종'} 월 매출
                규모
              </p>
              <div className="flex items-baseline gap-2">
                {loading ? (
                  <div className="h-9 w-32 bg-slate-200 animate-pulse rounded" />
                ) : (
                  <span className="text-h3 font-black text-primary">
                    {metrics
                      ? metrics.industryRevenue === 0
                        ? '데이터 없음'
                        : `약 ${formatMoney(metrics.industryRevenue)}`
                      : '-'}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center gap-2">
              <span className="text-caption font-bold text-slate-600">
                상권 전체 매출의
              </span>
              <span className="text-h5 font-heading text-info">
                {metrics && metrics.totalRevenue > 0
                  ? (
                      (metrics.industryRevenue / metrics.totalRevenue) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
              <span className="text-caption font-bold text-slate-600">
                차지
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
