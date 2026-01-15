'use client';

import {
  ArrowLeft,
  TrendingUp,
  Users,
  BarChart3,
  Building2,
  GripVertical,
  Newspaper,
} from 'lucide-react';
import { MatchingContent } from './location-detail/MatchingContent';
import { TrafficContent } from './location-detail/TrafficContent';
import { AnalysisContent } from './location-detail/AnalysisContent';
import { RealEstateContent } from './location-detail/RealEstateContent';
import { MapSection } from './location-detail/MapSection';
import { RealEstateDetailPanel } from './location-detail/RealEstateDetailPanel';
import NewsSection from '@/components/NewsSection';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Resizable } from 're-resizable';
import Link from 'next/link';
import type {
  CommercialBasicInfo,
  MarketAnalytics,
  RealEstateItem,
  FootTrafficAnalysis,
} from './location-detail/types';
import { addToHistory } from '@/hooks/useLocationHistory';
import { GenderFilter, AgeFilter } from './location-detail/types';

interface LocationDetailPageProps {
  basicInfo: CommercialBasicInfo;
  analytics: MarketAnalytics | null;
  realEstate: RealEstateItem[];
  footTraffic?: FootTrafficAnalysis | null;
}

export function LocationDetailPage({
  basicInfo,
  analytics,
  realEstate,
  footTraffic,
}: LocationDetailPageProps) {
  const [activeTab, setActiveTab] = useState<
    'matching' | 'traffic' | 'analysis' | 'realestate' | 'news'
  >('matching');
  const [mapWidth, setMapWidth] = useState<number | string>('30%');

  /**
   * 【Lifting State Up 패턴】
   * 선택된 매물 상태를 부모(LocationDetailPage)에서 관리합니다.
   * 이렇게 하면 MapSection(마커)과 RealEstateDetailPanel(상세패널)이
   * 동일한 상태를 공유할 수 있습니다.
   */
  const [selectedItem, setSelectedItem] = useState<RealEstateItem | null>(null);

  // 【업종 분석 카테고리 선택 상태】 지도에 점포 마커 표시용
  const [selectedAnalysisCategory, setSelectedAnalysisCategory] =
    useState<string>('ALL');

  // 【최소/최대 가격 계산】 useMemo로 최적화
  const priceRange = useMemo(() => {
    if (realEstate.length === 0)
      return { minDeposit: 0, maxDeposit: 10000, minRent: 0, maxRent: 1000 };
    const deposits = realEstate.map((i) => i.deposit ?? 0);
    const rents = realEstate.map((i) => i.monthlyrent ?? 0);
    return {
      minDeposit: Math.min(...deposits),
      maxDeposit: Math.max(...deposits),
      minRent: Math.min(...rents),
      maxRent: Math.max(...rents),
    };
  }, [realEstate]);

  // 【지도 범위 상태】
  const [mapBounds, setMapBounds] = useState<{
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null>(null);

  // 【가격 필터 상태】 초기값을 priceRange에서 가져옴
  const [depositRange, setDepositRange] = useState<[number, number]>(() => [
    priceRange.minDeposit,
    priceRange.maxDeposit,
  ]);
  const [rentRange, setRentRange] = useState<[number, number]>(() => [
    priceRange.minRent,
    priceRange.maxRent,
  ]);

  // 【필터링된 매물 목록】
  const filteredItems = useMemo(() => {
    return realEstate.filter((item) => {
      // 가격 필터
      const deposit = item.deposit ?? 0;
      const rent = item.monthlyrent ?? 0;
      if (deposit < depositRange[0] || deposit > depositRange[1]) return false;
      if (rent < rentRange[0] || rent > rentRange[1]) return false;

      // 지도 범위 필터
      if (mapBounds && item.centerlatitude && item.centerlongitude) {
        const lat = item.centerlatitude;
        const lng = item.centerlongitude;
        if (lat < mapBounds.sw.lat || lat > mapBounds.ne.lat) return false;
        if (lng < mapBounds.sw.lng || lng > mapBounds.ne.lng) return false;
      }

      return true;
    });
  }, [realEstate, depositRange, rentRange, mapBounds]);

  // 【콜백 핸들러】 useCallback으로 리렌더 최적화
  const handleMarkerClick = useCallback((item: RealEstateItem) => {
    setSelectedItem(item);
  }, []);

  const handleBoundsChange = useCallback(
    (bounds: {
      sw: { lat: number; lng: number };
      ne: { lat: number; lng: number };
    }) => {
      setMapBounds(bounds);
    },
    [],
  );

  // 【유동인구 히트맵 상태】 시간대별 자동 재생 및 필터
  const [trafficState, setTrafficState] = useState({
    isPlaying: true,
    currentTimeIndex: 12, // 기본: 점심 12시
    genderFilter: 'all' as GenderFilter,
    ageFilter: 'all' as AgeFilter,
  });

  // 【시간대 자동 전환 타이머】 1초마다 다음 시간대로 이동 (0~23시 순환)
  useEffect(() => {
    if (!trafficState.isPlaying || activeTab !== 'traffic') return;

    const timer = setInterval(() => {
      setTrafficState((prev) => ({
        ...prev,
        currentTimeIndex: (prev.currentTimeIndex + 1) % 24, // 24시간 순환
      }));
    }, 250);

    return () => clearInterval(timer);
  }, [trafficState.isPlaying, activeTab]);

  // 【트래픽 핸들러】
  const handleTrafficPlayToggle = useCallback(() => {
    setTrafficState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleTrafficTimeChange = useCallback((hour: number) => {
    setTrafficState((prev) => ({
      ...prev,
      currentTimeIndex: hour,
      isPlaying: false,
    }));
  }, []);

  const handleTrafficFilterChange = useCallback(
    (gender: GenderFilter, age: AgeFilter) => {
      setTrafficState((prev) => ({
        ...prev,
        genderFilter: gender,
        ageFilter: age,
      }));
    },
    [],
  );

  const tabs = [
    {
      id: 'matching' as const,
      label: '업종 매칭도',
      icon: TrendingUp,
    },
    { id: 'traffic' as const, label: '유동인구', icon: Users },
    {
      id: 'analysis' as const,
      label: '업종 / 매출 분석',
      icon: BarChart3,
    },
    {
      id: 'realestate' as const,
      label: '부동산',
      icon: Building2,
    },
    {
      id: 'news' as const,
      label: '뉴스',
      icon: Newspaper,
    },
  ];

  useEffect(() => {
    if (basicInfo?.code) {
      addToHistory(basicInfo.code);
    }
  }, [basicInfo?.code]);

  return (
    <div className="h-full bg-[#f7f7f8]">
      {/* 사이드바와 맞춤: 상하좌 p-4, 오른쪽만 pr-8 추가 */}
      <div className="h-full flex flex-col">
        {/* 헤더: 고정 높이 (shrink 방지) */}
        <div className="mb-2 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <Link
                href="/locations"
                className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-gray-100 transition-colors shrink-0"
              >
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </Link>
              <h1 className="text-display font-bold text-gray-900">
                {basicInfo.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-12">
            <p className="text-h2 text-gray-500">
              서울시 {basicInfo.guName} {basicInfo.dongName}
            </p>
          </div>
        </div>

        {/* 메인 콘텐츠: 남은 공간 모두 채움 */}
        <div className="flex gap-4 flex-1 items-stretch overflow-hidden">
          <Resizable
            size={{ width: mapWidth, height: 'h-full' }}
            onResizeStop={(e, direction, ref) => {
              const parent = ref.parentElement;
              if (parent) {
                const parentWidth = parent.offsetWidth - 32;
                const newWidthPx = ref.offsetWidth;
                const newPercentage = (newWidthPx / parentWidth) * 100;
                setMapWidth(`${newPercentage}%`);
              }
            }}
            minWidth="20%"
            maxWidth="40%"
            enable={{ right: true }}
            handleStyles={{
              right: {
                width: '12px',
                right: '-22px',
                zIndex: 10,
              },
            }}
            handleComponent={{
              right: (
                <div className="h-full flex items-center justify-center group cursor-col-resize">
                  <div className="w-1.5 h-16 bg-slate-300 rounded-full group-hover:bg-blue-600 transition-all group-hover:h-24 group-hover:w-2 flex items-center justify-center shadow-sm">
                    <GripVertical className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ),
            }}
            className="shrink-0"
          >
            {/* MapSection: 서버에서 계산된 중심점 좌표와 폴리곤 데이터 전달 */}
            <MapSection
              mode={activeTab}
              polygonData={basicInfo.polygons}
              centerX={basicInfo.x}
              centerY={basicInfo.y}
              realEstateItems={filteredItems}
              selectedItemId={selectedItem?.id}
              onMarkerClick={handleMarkerClick}
              priceFilter={{
                ...priceRange,
                depositRange,
                rentRange,
              }}
              onDepositChange={setDepositRange}
              onRentChange={setRentRange}
              onBoundsChange={handleBoundsChange}
              filteredCount={filteredItems.length}
              totalCount={realEstate.length}
              selectedAnalysisCategory={selectedAnalysisCategory}
              regionCode={basicInfo.code}
              trafficFilter={trafficState}
              onTrafficPlayToggle={handleTrafficPlayToggle}
              onTrafficTimeChange={handleTrafficTimeChange}
              onTrafficFilterChange={handleTrafficFilterChange}
            />
          </Resizable>

          <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
              <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-5 py-2 rounded-xl text-h5 font-strong transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-950 font-bold text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <div className="h-full bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <div className="p-8">
                    {activeTab === 'matching' && (
                      <MatchingContent
                        locationName={basicInfo.name}
                        trdarCd={basicInfo.code}
                      />
                    )}
                    {activeTab === 'traffic' && (
                      <TrafficContent
                        footTraffic={footTraffic ?? null}
                        regionCode={basicInfo.code}
                      />
                    )}
                    {activeTab === 'analysis' && (
                      <AnalysisContent
                        analytics={analytics}
                        regionCode={basicInfo.code}
                        onCategoryChange={setSelectedAnalysisCategory}
                      />
                    )}
                    {activeTab === 'realestate' && (
                      <RealEstateContent
                        items={filteredItems}
                        onItemClick={handleMarkerClick}
                      />
                    )}
                    {activeTab === 'news' && (
                      <div className="w-full">
                        <NewsSection
                          region={basicInfo.code}
                          locationName={basicInfo.dongName}
                          showImages={true}
                          showPagination={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        【조건부 렌더링 (Conditional Rendering)】
        selectedItem이 존재할 때만 상세 패널을 렌더링합니다.
        && 연산자: 왼쪽이 truthy일 때만 오른쪽을 평가/렌더링
      */}
      {selectedItem && (
        <RealEstateDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
