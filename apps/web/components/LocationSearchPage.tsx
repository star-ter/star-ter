'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, X } from 'lucide-react';

import {
  fetchLocationRanking,
  fetchPopulationRanking,
  fetchClosureRateRanking,
  fetchMZRanking,
  LocationRankItem,
  PopulationRankItem,
  ClosureRateRankItem,
  INDUSTRY_CATEGORIES,
  AGE_GROUP_OPTIONS,
  TIME_SLOT_OPTIONS,
  SortBy,
  AgeGroup,
  TimeSlot,
} from '@/services/location/location.service';
import {
  getRecommendations,
  ScoredLocation,
} from '@/services/location/locationRecommend.service';
import { getOnboarding } from '@/services/user/user.api';
import { useUserStore } from '@/store/use-user-store';

export { type LocationRankItem } from '@/services/location/location.service';

const ITEMS_PER_PAGE = 20;

// 탭 타입 확인
const isPopulationTab = (tab: string) => tab === '유동인구 순';
const isClosureRateTab = (tab: string) => tab === '폐업률 높은 순';
const isMZTab = (tab: string) => tab === 'MZ 선호 순';
const isRecommendTab = (tab: string) => tab === '맞춤 추천';

interface LocationSearchPageProps {
  initialTab?: string;
}

export function LocationSearchPage({
  initialTab = '평균 매출 순',
}: LocationSearchPageProps) {
  const router = useRouter();

  const [subTab, setSubTab] = useState(initialTab);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [industryCode, setIndustryCode] = useState('');
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);

  // 로그인 상태
  const authUser = useUserStore((state) => state.authUser);

  // 매출 데이터
  const [rankData, setRankData] = useState<LocationRankItem[]>([]);
  // 유동인구 데이터
  const [populationData, setPopulationData] = useState<PopulationRankItem[]>(
    [],
  );
  // 폐업률 데이터
  const [closureData, setClosureData] = useState<ClosureRateRankItem[]>([]);
  // 맞춤 추천 데이터
  const [recommendData, setRecommendData] = useState<ScoredLocation[]>([]);
  // 유동인구 필터
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('total');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('total');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 검색어 디바운스
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const subTabs = [
    '맞춤 추천',
    '평균 매출 순',
    '매출 성장 순',
    '유동인구 순',
    '폐업률 높은 순',
    'MZ 선호 순',
  ];

  // 현재 선택된 업종명 찾기
  const selectedIndustryName = useMemo(() => {
    if (!industryCode) return '전체 업종';
    for (const category of INDUSTRY_CATEGORIES) {
      const found = category.items.find((item) => item.code === industryCode);
      if (found) return found.name;
    }
    return '전체 업종';
  }, [industryCode]);

  // 대분류에 속한 소분류 목록
  const minorCategories = useMemo(() => {
    if (!selectedMajor) return null;
    return (
      INDUSTRY_CATEGORIES.find((c) => c.major === selectedMajor)?.items || []
    );
  }, [selectedMajor]);

  // subTab에 따른 정렬 방식 결정
  const getSortBy = (tab: string): SortBy => {
    if (tab === '매출 성장 순') return 'growth';
    return 'average';
  };

  // 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setDisplayCount(ITEMS_PER_PAGE);

      try {
        if (isRecommendTab(subTab)) {
          // 맞춤 추천
          if (!authUser) {
            setRecommendData([]);
            setError('로그인이 필요합니다.');
            return;
          }

          const onboarding = await getOnboarding();
          if (!onboarding || !onboarding.completed) {
            setRecommendData([]);
            setError('온보딩을 완료해주세요.');
            return;
          }

          if (
            !onboarding.age ||
            !onboarding.region ||
            !onboarding.operatingTime ||
            !onboarding.capital
          ) {
            setRecommendData([]);
            setError('온보딩 정보가 부족합니다.');
            return;
          }

          const response = await getRecommendations({
            age: onboarding.age,
            region: onboarding.region,
            operatingTime: onboarding.operatingTime,
            capital: onboarding.capital,
            industryCode: onboarding.industryCode,
          });

          if (response) {
            setRecommendData(response.locations);
          } else {
            setRecommendData([]);
          }
        } else if (isPopulationTab(subTab)) {
          // 유동인구 순
          const data = await fetchPopulationRanking(
            'commercial',
            ageGroup,
            timeSlot,
            debouncedQuery,
          );
          setPopulationData(data);
        } else if (isClosureRateTab(subTab)) {
          // 폐업률 낮은 순
          const data = await fetchClosureRateRanking(
            'commercial',
            industryCode || undefined,
            debouncedQuery,
          );
          setClosureData(data);
        } else if (isMZTab(subTab)) {
          // MZ 선호 순
          const data = await fetchMZRanking('commercial', debouncedQuery);
          // MZ 랭킹은 PopulationRankItem 형식을 따름
          setPopulationData(data);
        } else {
          // 매출 순
          const sortBy = getSortBy(subTab);
          const data = await fetchLocationRanking(
            'commercial',
            industryCode || undefined,
            sortBy,
            debouncedQuery,
          );
          setRankData(data);
        }
      } catch (err) {
        console.error('Failed to fetch ranking:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [subTab, industryCode, ageGroup, timeSlot, debouncedQuery, authUser]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsIndustryOpen(false);
      }
    };

    if (isIndustryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isIndustryOpen]);

  const handleLocationClick = (
    item: LocationRankItem | PopulationRankItem | ClosureRateRankItem,
  ) => {
    router.push(`/locations/detail/${item.code}`);
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleClearFilter = () => {
    setIndustryCode('');
    setSelectedMajor(null);
  };

  // 현재 탭에 따른 데이터
  const currentData = isRecommendTab(subTab)
    ? recommendData
    : isPopulationTab(subTab) || isMZTab(subTab)
      ? populationData
      : isClosureRateTab(subTab)
        ? closureData
        : rankData;
  const displayedData = currentData.slice(0, displayCount);
  const hasMore = displayCount < currentData.length;

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="px-8 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-8">
              <h1 className="text-h1 font-heading text-foreground">
                실시간 상권 차트
              </h1>
            </div>

            {/* 검색 입력창 */}
            <div className="relative w-64">
              <input
                type="text"
                placeholder="상권명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-info focus:bg-card transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-4 flex flex-col gap-3 shrink-0 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-muted p-1 rounded-xl gap-1">
              {subTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className={`px-4 py-2 text-caption rounded-lg transition-all ${
                    subTab === tab
                      ? 'bg-card text-foreground font-bold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 필터 영역 - 오른쪽에 고정 */}
            <div className="flex items-center gap-2">
              {/* 유동인구 탭: 연령대 + 시간대 필터 */}
              {isPopulationTab(subTab) ? (
                <>
                  {/* 연령대 드롭다운 */}
                  <div className="flex bg-muted p-0.5 rounded-lg">
                    {AGE_GROUP_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setAgeGroup(opt.value)}
                        className={`px-3 py-1.5 text-tiny rounded-md transition-all ${
                          ageGroup === opt.value
                            ? 'bg-card text-foreground font-bold shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {/* 시간대 드롭다운 */}
                  <div className="flex bg-muted p-0.5 rounded-lg">
                    {TIME_SLOT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTimeSlot(opt.value)}
                        className={`px-3 py-1.5 text-tiny rounded-md transition-all ${
                          timeSlot === opt.value
                            ? 'bg-card text-foreground font-bold shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : isMZTab(subTab) ||
                isRecommendTab(
                  subTab,
                ) /* MZ 탭, 맞춤 추천 탭: 필터 없음 */ ? null : (
                /* 매출 탭: 업종 필터 */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setIsIndustryOpen(!isIndustryOpen);
                      setSelectedMajor(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-tiny font-bold transition-colors ${
                      industryCode
                        ? 'bg-info/10 text-info hover:bg-info/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {selectedIndustryName}
                    {industryCode ? (
                      <X
                        className="w-4 h-4 hover:text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFilter();
                        }}
                      />
                    ) : (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isIndustryOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {isIndustryOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50">
                      {!selectedMajor ? (
                        <div className="p-2">
                          <div className="px-3 py-2 text-caption font-bold text-muted-foreground uppercase">
                            대분류 선택
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {INDUSTRY_CATEGORIES.map((category) => (
                              <button
                                key={category.major}
                                onClick={() => setSelectedMajor(category.major)}
                                className="px-3 py-2.5 text-left text-caption font-strong text-foreground hover:bg-muted rounded-lg transition-colors"
                              >
                                {category.major}
                                <span className="text-muted-foreground ml-1 text-caption">
                                  ({category.items.length})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted">
                            <button
                              onClick={() => setSelectedMajor(null)}
                              className="text-tiny font-strong text-muted-foreground hover:text-foreground"
                            >
                              ← 뒤로
                            </button>
                            <span className="text-caption font-bold text-foreground">
                              {selectedMajor}
                            </span>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-2">
                            {minorCategories?.map((item) => (
                              <button
                                key={item.code}
                                onClick={() => {
                                  setIndustryCode(item.code);
                                  setIsIndustryOpen(false);
                                  setSelectedMajor(null);
                                }}
                                className={`w-full px-2 py-2 text-left text-caption rounded-lg transition-colors ${
                                  industryCode === item.code
                                    ? 'text-info font-bold bg-info/10'
                                    : 'text-foreground hover:bg-muted'
                                }`}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 테이블 헤더 - 탭에 따라 다르게 표시 */}
        <div
          className="px-6 py-3 grid items-center text-body font-strong text-muted-foreground shrink-0 border-b border-border bg-muted/30 gap-4"
          style={{
            gridTemplateColumns: isRecommendTab(subTab)
              ? '3fr 1fr 2fr'
              : isPopulationTab(subTab)
                ? '3fr 1.2fr 0.8fr 1fr'
                : isMZTab(subTab)
                  ? '3fr 1.2fr 0.8fr 1fr'
                  : isClosureRateTab(subTab)
                    ? '3fr 0.6fr 1fr 1.2fr 1fr'
                    : '3fr 1fr 1.2fr 1fr 1.2fr',
          }}
        >
          {isRecommendTab(subTab) ? (
            <>
              <div className="text-left pl-6">순위 / 상권명</div>
              <div className="text-center">매칭 점수</div>
              <div className="text-center">상세 점수</div>
            </>
          ) : isPopulationTab(subTab) ? (
            <>
              <div className="text-left pl-6">순위 / 상권명</div>
              <div className="text-center">유동인구 (명)</div>
              <div className="text-center">등락률</div>
              <div className="text-center">상권 상태</div>
            </>
          ) : isMZTab(subTab) ? (
            <>
              <div className="text-left pl-6">순위 / 상권명</div>
              <div className="text-center">MZ 인구 (명)</div>
              <div className="text-center">MZ 비중</div>
              <div className="text-center">상권 상태</div>
            </>
          ) : isClosureRateTab(subTab) ? (
            <>
              <div className="text-left pl-6">순위 / 상권명</div>
              <div className="text-center">폐업률</div>
              <div className="text-center">폐업 점포</div>
              <div className="text-center">점포 수 변화 (전분기 → 현분기)</div>
              <div className="text-center">상권 상태</div>
            </>
          ) : (
            <>
              <div className="text-left pl-6">순위 · 상권명 / 점포 수</div>
              <div className="text-center">평균 매출(분기)</div>
              <div className="text-center">전분기 대비</div>
              <div className="text-center">분기 총 매출</div>
              <div className="text-center">성별 매출 비율 (남/여)</div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-visible px-6 pb-10 no-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-h4 font-strong text-foreground">{error}</p>
              <p className="text-body text-muted-foreground">
                맞춤 추천을 받으려면 로그인이 필요합니다.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="mt-2 px-6 py-2.5 bg-info text-white font-bold rounded-xl hover:bg-info/90 transition-colors"
              >
                로그인하기
              </button>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              데이터가 없습니다.
            </div>
          ) : isRecommendTab(subTab) ? (
            // 맞춤 추천 리스트
            (displayedData as ScoredLocation[]).map((item, index) => (
              <button
                key={item.id}
                onClick={() => router.push(`/locations/detail/${item.id}`)}
                className="w-full py-4 items-center hover:bg-muted/50 rounded-2xl transition-all group relative grid gap-4 text-left"
                style={{ gridTemplateColumns: '3fr 1fr 2fr' }}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-h5 font-strong text-muted-foreground group-hover:text-foreground transition-colors">
                    {index + 1}
                  </span>
                  <div className="text-left">
                    <div className="text-h5 font-bold text-foreground group-hover:text-info transition-colors">
                      {item.name}
                    </div>
                  </div>
                </div>

                {/* 점수 뱃지 - 기본 표시 */}
                <div className="text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-caption font-strong ${
                      item.totalScore >= 90
                        ? 'bg-success/10 text-success'
                        : item.totalScore >= 70
                          ? 'bg-info/10 text-info'
                          : item.totalScore >= 50
                            ? 'bg-accent/10 text-accent'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.totalScore.toFixed(1)}점
                  </span>
                </div>

                {/* 호버 시 점수 그래프 - 플로팅 툴팁 */}
                <div className="flex items-center justify-center">
                  <div className="text-caption text-muted-foreground">
                    마우스를 올려 상세 점수 보기
                  </div>

                  {/* 플로팅 툴팁 모달 - 상단 3개는 아래쪽, 나머지는 위쪽으로 표시 */}
                  <div
                    className={`hidden group-hover:block absolute right-0 z-9999 ${
                      index < 5 ? 'top-full mt-2' : 'bottom-full mb-2'
                    }`}
                  >
                    <div className="bg-white rounded-xl shadow-xl border border-border p-5 relative">
                      {/* 화살표 - 방향에 따라 다르게 (테두리 효과) */}
                      {index < 5 ? (
                        <div className="absolute -top-2.5 right-8">
                          {/* 테두리용 삼각형 (뒤) */}
                          <div
                            className="w-0 h-0 border-l-11 border-r-11 border-b-11 border-l-transparent border-r-transparent border-b-border"
                            style={{
                              position: 'absolute',
                              top: '-1px',
                              left: '-1px',
                            }}
                          />
                          {/* 흰색 삼각형 (앞) */}
                          <div
                            className="w-0 h-0 border-l-10 border-r-10 border-b-10 border-l-transparent border-r-transparent border-b-white"
                            style={{
                              position: 'absolute',
                              top: '1px',
                              left: '0px',
                            }}
                          />
                        </div>
                      ) : (
                        <div className="absolute -bottom-2.5 right-8">
                          {/* 테두리용 삼각형 (뒤) */}
                          <div
                            className="w-0 h-0 border-l-11 border-r-11 border-t-11 border-l-transparent border-r-transparent border-t-border"
                            style={{
                              position: 'absolute',
                              bottom: '-1px',
                              left: '-1px',
                            }}
                          />
                          {/* 흰색 삼각형 (앞) */}
                          <div
                            className="w-0 h-0 border-l-10 border-r-10 border-t-10 border-l-transparent border-r-transparent border-t-white"
                            style={{
                              position: 'absolute',
                              bottom: '1px',
                              left: '0px',
                            }}
                          />
                        </div>
                      )}

                      {/* 라인 차트 */}
                      {(() => {
                        const scores = [
                          { label: '타깃연령', value: item.scores.age },
                          { label: '창업비용', value: item.scores.rent },
                          { label: '상권테마', value: item.scores.region },
                          { label: '운영시간', value: item.scores.time },
                          {
                            label: '업종적합',
                            value: item.scores.industry ?? 0.5,
                          },
                        ];

                        const chartWidth = 400;
                        const chartHeight = 220;
                        const padding = {
                          top: 20,
                          right: 25,
                          bottom: 50,
                          left: 45,
                        };
                        const innerWidth =
                          chartWidth - padding.left - padding.right;
                        const innerHeight =
                          chartHeight - padding.top - padding.bottom;

                        // X, Y 좌표 계산
                        const xStep = innerWidth / (scores.length - 1);
                        const getX = (i: number) => padding.left + i * xStep;
                        const getY = (value: number) =>
                          padding.top + innerHeight * (1 - value);

                        // 라인 경로 생성
                        const linePath = scores
                          .map(
                            (s, i) =>
                              `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(s.value)}`,
                          )
                          .join(' ');

                        return (
                          <div className="flex flex-col items-center">
                            <svg width={chartWidth} height={chartHeight}>
                              {/* Y축 그리드 라인 (25%, 50%, 75%, 100%) */}
                              {[0.25, 0.5, 0.75, 1].map((level, i) => (
                                <g key={i}>
                                  <line
                                    x1={padding.left}
                                    y1={getY(level)}
                                    x2={chartWidth - padding.right}
                                    y2={getY(level)}
                                    stroke="var(--border)"
                                    strokeWidth="1"
                                    strokeDasharray={level === 1 ? '0' : '3,3'}
                                  />
                                  <text
                                    x={padding.left - 8}
                                    y={getY(level)}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    className="text-tiny fill-muted-foreground"
                                  >
                                    {Math.round(level * 100)}
                                  </text>
                                </g>
                              ))}

                              {/* X축 기준선 */}
                              <line
                                x1={padding.left}
                                y1={getY(0)}
                                x2={chartWidth - padding.right}
                                y2={getY(0)}
                                stroke="var(--border)"
                                strokeWidth="1"
                              />

                              {/* 데이터 영역 (그라데이션) */}
                              <defs>
                                <linearGradient
                                  id={`areaGradient-${item.id}`}
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="var(--info)"
                                    stopOpacity="0.3"
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="var(--info)"
                                    stopOpacity="0"
                                  />
                                </linearGradient>
                              </defs>
                              <path
                                d={`${linePath} L ${getX(scores.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
                                fill={`url(#areaGradient-${item.id})`}
                              />

                              {/* 데이터 라인 */}
                              <path
                                d={linePath}
                                fill="none"
                                stroke="var(--info)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              {/* 데이터 포인트 */}
                              {scores.map((s, i) => (
                                <circle
                                  key={i}
                                  cx={getX(i)}
                                  cy={getY(s.value)}
                                  r="5"
                                  fill="var(--info)"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                              ))}

                              {/* X축 라벨 */}
                              {scores.map((s, i) => (
                                <text
                                  key={i}
                                  x={getX(i)}
                                  y={chartHeight - 20}
                                  textAnchor="middle"
                                  className="text-tiny fill-muted-foreground font-medium"
                                >
                                  {s.label}
                                </text>
                              ))}

                              {/* X축 점수 값 */}
                              {scores.map((s, i) => (
                                <text
                                  key={`val-${i}`}
                                  x={getX(i)}
                                  y={chartHeight - 5}
                                  textAnchor="middle"
                                  className="text-tiny fill-info font-bold"
                                >
                                  {Math.round(s.value * 100)}%
                                </text>
                              ))}
                            </svg>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : isPopulationTab(subTab) ? (
            // 유동인구 리스트
            (displayedData as PopulationRankItem[]).map((item) => (
              <button
                key={`${item.id}-${item.rank}-${item.name}`}
                onClick={() => handleLocationClick(item)}
                className="w-full py-4 items-center hover:bg-muted/50 rounded-2xl transition-all group grid gap-4 text-left"
                style={{ gridTemplateColumns: '3fr 1.2fr 0.8fr 1fr' }}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-h5 font-strong text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.rank}
                  </span>
                  <div className="text-left">
                    <div className="text-h5 font-bold text-foreground group-hover:text-info transition-colors">
                      {item.name}
                    </div>
                  </div>
                </div>

                <div className="text-center text-h5 font-strong text-foreground">
                  {item.population}
                </div>

                <div className="flex justify-center">
                  <div
                    className={`px-2 py-1 rounded-lg text-caption font-strong min-w-15 ${
                      item.growthRate > 0
                        ? 'bg-danger/10 text-danger'
                        : 'bg-info/10 text-info'
                    }`}
                  >
                    {item.growthRate > 0 ? '▲' : '▼'}{' '}
                    {Math.abs(item.growthRate).toFixed(1)}%
                  </div>
                </div>

                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-lg text-caption font-strong ${
                      item.statusType === 'hot'
                        ? 'bg-danger/10 text-danger'
                        : item.statusType === 'stable'
                          ? 'bg-success/10 text-success'
                          : item.statusType === 'danger'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </button>
            ))
          ) : isMZTab(subTab) ? (
            // MZ 리스트 (PopulationRankItem 재사용)
            (displayedData as PopulationRankItem[]).map((item) => (
              <button
                key={`${item.id}-${item.rank}-${item.name}`}
                onClick={() => handleLocationClick(item)}
                className="w-full py-4 items-center hover:bg-muted/50 rounded-2xl transition-all group grid gap-4 text-left"
                style={{ gridTemplateColumns: '3fr 1.2fr 0.8fr 1fr' }}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-h5 font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.rank}
                  </span>
                  <div className="text-left">
                    <div className="text-h5 font-bold text-foreground group-hover:text-info transition-colors">
                      {item.name}
                    </div>
                  </div>
                </div>

                <div className="text-center text-h5 font-strong text-foreground">
                  {item.population}
                </div>

                <div className="flex justify-center">
                  <div className="px-2 py-1 rounded-lg text-caption font-strong min-w-15 bg-accent/10 text-accent">
                    {item.growthRate.toFixed(1)}%
                  </div>
                </div>

                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      item.statusType === 'hot'
                        ? 'bg-danger/10 text-danger'
                        : item.statusType === 'stable'
                          ? 'bg-success/10 text-success'
                          : item.statusType === 'danger'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </button>
            ))
          ) : isClosureRateTab(subTab) ? (
            // 폐업률 리스트
            (displayedData as ClosureRateRankItem[]).map((item) => (
              <button
                key={`${item.id}-${item.rank}-${item.name}`}
                onClick={() => handleLocationClick(item)}
                className="w-full py-4 items-center hover:bg-muted/50 rounded-2xl transition-all group grid gap-4 text-left"
                style={{ gridTemplateColumns: '3fr 0.6fr 1fr 1.2fr 1fr' }}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-h5 font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.rank}
                  </span>
                  <div className="text-left">
                    <div className="text-h5 font-bold text-foreground group-hover:text-info transition-colors">
                      {item.name}
                    </div>
                  </div>
                </div>

                <div className="text-center text-h5 font-strong text-foreground">
                  {item.closureRate}%
                </div>

                <div className="text-center text-h5 font-strong text-muted-foreground">
                  <span className="text-danger font-heading">
                    {item.closedStoreCount}
                  </span>
                  개 폐업
                </div>

                <div className="flex justify-center items-center gap-2 text-caption text-muted-foreground">
                  <span>{item.previousStoreCount}개</span>
                  <span className="text-border">→</span>
                  <span className="font-strong text-foreground">
                    {item.currentStoreCount}개
                  </span>
                </div>

                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      item.statusType === 'hot'
                        ? 'bg-danger/10 text-danger'
                        : item.statusType === 'stable'
                          ? 'bg-success/10 text-success'
                          : item.statusType === 'danger'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </button>
            ))
          ) : (
            // 매출 리스트 (기본)
            (displayedData as LocationRankItem[]).map((item) => (
              <button
                key={`${item.id}-${item.rank}-${item.name}`}
                onClick={() => handleLocationClick(item)}
                className="w-full py-4 items-center hover:bg-muted/50 rounded-2xl transition-all group grid gap-4 text-left"
                style={{ gridTemplateColumns: '3fr 1fr 1.2fr 1fr 1.2fr' }}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-h5 font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.rank}
                  </span>

                  <div className="text-left">
                    <div className="text-h5 font-bold text-foreground group-hover:text-info transition-colors">
                      {item.name}
                    </div>
                    <div className="text-caption font-strong text-muted-foreground">
                      점포 수: {item.storeCount}개
                    </div>
                  </div>
                </div>

                <div className="text-center text-h5 font-strong text-foreground">
                  {item.avgRevenue}
                </div>

                <div className="w-full flex justify-center items-center">
                  <div
                    className={`px-2 py-1 rounded-lg text-caption font-strong ${
                      item.growthRate > 0
                        ? 'bg-danger/10 text-danger'
                        : 'bg-info/10 text-info'
                    }`}
                  >
                    {item.growthRate > 0 ? '+' : ''}
                    {item.growthRate.toFixed(1)}%
                  </div>
                </div>

                <div className="text-center text-h5 font-strong text-foreground">
                  {item.totalRevenue}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex w-32 h-1.5 rounded-full overflow-hidden bg-muted">
                    <div
                      className="h-full bg-gender-male transition-all duration-1000"
                      style={{ width: `${item.ratio.male}%` }}
                    />
                    <div
                      className="h-full bg-gender-female transition-all duration-1000"
                      style={{ width: `${item.ratio.female}%` }}
                    />
                  </div>
                  <div className="flex justify-between w-32 text-caption font-strong text-muted-foreground">
                    <span className="text-gender-male">{item.ratio.male}</span>
                    <span className="text-gender-female">
                      {item.ratio.female}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}

          {hasMore && !isLoading && !error && (
            <div className="mt-8 mb-10 flex justify-center">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 bg-muted text-muted-foreground rounded-xl text-caption font-strong hover:bg-muted/80 transition-all"
              >
                더 보기 ({displayCount} / {currentData.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
