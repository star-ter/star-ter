import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SalesTrendGraph from './SalesTrendGraph';
import WeeklySalesGraph from './WeeklySalesGraph';
import AgeGenderSalesGraph from './AgeGenderSalesGraph';
import TimeOfDaySalesGraph from './TimeOfDaySalesGraph';
import AgeGenderRadarChart from './AgeGenderRadarChart';
import { AnalysisData, AnalysisCardProps } from '../../types/analysis-types';

export default function AnalysisCard({
  title,
  address,
  estimatedSales: initialEstimatedSales,
  storeCount: initialStoreCount,
  color = '#4A90E2',
  onClose,
  onClear,
  hoveredTab,
  onTabHover,
  activeTab = 'sales',
  onTabChange,
  scrollRef,
  onScroll,
  regionCode, 
}: AnalysisCardProps) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedStoreCategories, setExpandedStoreCategories] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Use title as fallback for regionCode if not explicitly provided
  const queryParam = regionCode || title;

  useEffect(() => {
    async function fetchData() {
        if (!queryParam) return;
        setLoading(true);
        try {
            // Encode URI component to handle Korean characters safely
            // Add timestamp to foil cache
            const res = await fetch(`http://localhost:4000/analysis/${encodeURIComponent(queryParam)}?_t=${Date.now()}`);
            const json = await res.json();
            if (json.sales) {
                if (json.store && json.store.categories) {
                    console.log('DEBUG: Store categories count:', json.store.categories.length);
                }
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch analysis data", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [queryParam]);

  // Format currency helper
  const formatCurrency = (val: string) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) return val;
      
      // 1억 미만
      if (num < 100000000) {
          return `${num.toLocaleString()}원`;
      }
      
      // 1억 이상: "1,624억 원" 형태로 표시
      const billion = Math.round(num / 100000000);
      return `${billion.toLocaleString()}억 원`;
  };

  const displaySales = data ? formatCurrency(data.sales.total) : initialEstimatedSales;

  return (
    <div className="bg-white/60 rounded-3xl shadow-xl p-5 w-[90vw] sm:w-[25vw] min-w-[280px] h-[64vh] min-h-[350px] flex flex-col relative animate-fade-in-up backdrop-blur-sm">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center justify-center gap-2">
          <span className="truncate max-w-[60%] block" title={title}>
            {title.replace(/^서울특별시\s*/, '')}
          </span>
          <button
            className="text-xs font-normal text-blue-500 px-2 py-0.5 rounded hover:font-semibold hover:text-blue-600 transition shrink-0"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            주소 복사
          </button>
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-4">
        <button
          className={`flex-1 pb-2 text-sm transition-all ${
            activeTab === 'sales'
              ? 'font-semibold text-blue-600 border-b-2 border-blue-600'
              : hoveredTab === 'sales'
                ? 'text-gray-600 font-semibold border-b-2 border-blue-600/30'
                : 'font-medium text-gray-400 hover:text-gray-600 hover:font-semibold hover:border-b-2 hover:border-blue-600/30'
          }`}
          onMouseEnter={() => onTabHover?.('sales')}
          onMouseLeave={() => onTabHover?.(null)}
          onClick={() => onTabChange?.('sales')}
        >
          상권
        </button>
        <button
          className={`flex-1 pb-2 text-sm transition-all ${
            activeTab === 'store'
              ? 'font-semibold text-blue-600 border-b-2 border-blue-600'
              : hoveredTab === 'store'
                ? 'text-gray-600 font-semibold border-b-2 border-blue-600/30'
                : 'text-gray-400 hover:text-gray-600 hover:font-semibold hover:border-b-2 hover:border-blue-600/30'
          }`}
          onMouseEnter={() => onTabHover?.('store')}
          onMouseLeave={() => onTabHover?.(null)}
          onClick={() => onTabChange?.('store')}
        >
          매장
        </button>
        <button
          className={`flex-1 pb-2 text-sm transition-all ${
            activeTab === 'population'
              ? 'font-semibold text-blue-600 border-b-2 border-blue-600'
              : hoveredTab === 'population'
                ? 'text-gray-600 font-semibold border-b-2 border-blue-600/30'
                : 'text-gray-400 hover:text-gray-600 hover:font-semibold hover:border-b-2 hover:border-blue-600/30'
          }`}
          onMouseEnter={() => onTabHover?.('population')}
          onMouseLeave={() => onTabHover?.(null)}
          onClick={() => onTabChange?.('population')}
        >
          인구
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div 
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6"
      >
        {activeTab === 'sales' && (
          <div className="animate-fade-in space-y-6">
            {/* Main Metric */}
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">
                {data ? `${data.meta.yearQuarter.slice(0, 4)}년 ${data.meta.yearQuarter.slice(4)}분기 총 매출` : '11월 상권 추정 매출'}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-blue-600">
                  {loading ? 'Loading...' : displaySales}
                </span>
              </div>
            </div>

            {/* Graph */}
            <SalesTrendGraph color={color} data={data?.sales?.trend} />

             {/* Weekly Sales */}
             <WeeklySalesGraph data={data?.sales?.dayOfWeek} />

             {/* Age & Gender Sales */}
             <AgeGenderSalesGraph 
                ageData={data?.sales?.age} 
                genderData={data?.sales?.gender} 
             />

             {/* Time Of Day Sales */}
             <TimeOfDaySalesGraph data={data?.sales?.timeOfDay} />
          </div>
        )}

        {activeTab === 'store' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-bold text-gray-800 mb-1">총 매장 수</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-blue-600">
                      {data ? data.store.total.toLocaleString() : initialStoreCount}
                      <span className="text-base font-normal text-gray-600 ml-1">개</span>
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                 <div className="flex flex-col justify-center items-center min-w-[70px]">
                     <span className="text-[10px] text-gray-500 font-semibold">개업률</span>
                     <span className="text-base font-bold text-blue-600">
                        {data && data.store.openingRate !== undefined ? data.store.openingRate.toFixed(1) : '-'}%
                     </span>
                 </div>
                 <div className="flex flex-col justify-center items-center min-w-[70px]">
                     <span className="text-[10px] text-gray-500 font-semibold">폐업률</span>
                     <span className="text-base font-bold text-red-500">
                        {data && data.store.closingRate !== undefined ? data.store.closingRate.toFixed(1) : '-'}%
                     </span>
                 </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2 mb-2">주요 업종 분포</h4>
              
              {data && data.store.categories ? (
                  (() => {
                      const totalList = data.store.categories;
                      const showCount = expandedStoreCategories ? totalList.length : 10;
                      const visibleList = totalList.slice(0, showCount);
                      
                      const maxCount = Math.max(...totalList.map((c) => c.count)) || 1;
                      const totalStores = data.store.total || 1;
                      
                      return (
                        <>
                          {visibleList.map((item) => {
                              const relativePercent = (item.count / maxCount) * 100; // Scale relative to max item
                              const realPercent = Math.round((item.count / totalStores) * 100);
                              const isExpanded = expandedCategories.includes(item.name);
                              
                              const toggleCategory = () => {
                                setExpandedCategories(prev => 
                                  prev.includes(item.name) 
                                    ? prev.filter(name => name !== item.name)
                                    : [...prev, item.name]
                                );
                              };
                              
                              return (
                                <div key={item.name} className="flex flex-col group cursor-pointer" onClick={toggleCategory}>
                                    <div className="flex items-center text-sm py-1">
                                        <span className="text-gray-500 w-24 truncate font-medium group-hover:text-blue-600 group-hover:font-bold transition-all" title={item.name}>
                                            {item.name}
                                        </span>
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full mx-2">
                                            <div className="h-full bg-blue-500 rounded-full opacity-70 group-hover:opacity-100 transition-opacity" style={{ width: `${relativePercent}%` }}></div>
                                        </div>
                                        <div className="text-right w-20 mr-1">
                                            <span className="font-bold text-gray-800 mr-1">{item.count}</span>
                                            <span className="text-xs text-gray-400">({realPercent}%)</span>
                                        </div>
                                        <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                                            {isExpanded ? (
                                                <ChevronUp size={14} className="transition-all group-hover:stroke-[3]" />
                                            ) : (
                                                <ChevronDown size={14} className="transition-all group-hover:stroke-[3]" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Detailed Stats Dropdown with Smooth Transition */}
                                    <div 
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                            isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <div className="text-xs flex justify-center items-center gap-6 py-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">개업 점포</span>
                                                <span className="font-bold text-blue-600">{item.open || 0}개</span>
                                            </div>
                                            <div className="w-[1px] h-3 bg-gray-300"></div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">폐업 점포</span>
                                                <span className="font-bold text-red-500">{item.close || 0}개</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                              );
                          })}
                          
                          {totalList.length > 10 && (
                            <button 
                              onClick={() => setExpandedStoreCategories(!expandedStoreCategories)}
                              className="w-full py-2 text-xs text-gray-500 font-medium hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mt-2 border-t border-gray-50"
                            >
                              {expandedStoreCategories ? '접기' : '더보기'}
                            </button>
                          )}
                        </>
                      );
                  })()
              ) : (
                <div className="text-center text-gray-400 text-xs py-4">데이터를 불러오는 중입니다...</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'population' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">총 주거 인구</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-extrabold text-blue-600">
                    {data && data.population ? data.population.total.toLocaleString() : '0'}
                    <span className="text-base font-normal text-gray-600 ml-1">명</span>
                </span>
              </div>
            </div>

            {data && data.population ? (
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm h-[320px]">
                  <AgeGenderRadarChart populationData={data.population} />
                </div>
            ) : (
                <div className="text-center text-gray-400 text-sm py-10">인구 데이터가 없습니다.</div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}

    </div>
  );
}
