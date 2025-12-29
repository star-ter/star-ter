import React, { useEffect, useState } from 'react';
import SalesTrendGraph from './SalesTrendGraph';
import WeeklySalesGraph from './WeeklySalesGraph';
import AgeGenderSalesGraph from './AgeGenderSalesGraph';
import TimeOfDaySalesGraph from './TimeOfDaySalesGraph';
import AgeGenderRadarChart from './AgeGenderRadarChart';
interface AnalysisCardProps {
  title: string; // This is currently the Dong name (e.g. 창신1동)
  address: string;
  estimatedSales: string;
  salesChange: string; // e.g., "+3.5%"
  storeCount: string;
  color?: string;
  onClose: () => void;
  onClear: () => void;
  hoveredTab?: string | null;
  onTabHover?: (tab: string | null) => void;
  activeTab?: 'sales' | 'store' | 'population';
  onTabChange?: (tab: 'sales' | 'store' | 'population') => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  regionCode?: string; // Add regionCode prop if available, otherwise we might need to derive it or fetch it
}

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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
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
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">총 매장 수</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-extrabold text-blue-600">
                    {data ? data.store.total.toLocaleString() : initialStoreCount}
                    <span className="text-base font-normal text-gray-600 ml-1">개</span>
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">주요 업종 분포</h4>
              
              {data && data.store.categories ? (
                  (() => {
                      const maxCount = Math.max(...data.store.categories.map((c: any) => c.count)) || 1;
                      const totalStores = data.store.total || 1;
                      
                      return data.store.categories.map((item: any) => {
                          const relativePercent = (item.count / maxCount) * 100; // Scale relative to max item
                          const realPercent = Math.round((item.count / totalStores) * 100);
                          
                          return (
                            <div key={item.name} className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 w-24 truncate">{item.name}</span>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full mx-2">
                                    <div className="h-full bg-blue-500 rounded-full opacity-70" style={{ width: `${relativePercent}%` }}></div>
                                </div>
                                <div className="text-right w-20">
                                    <span className="font-bold text-gray-800 mr-1">{item.count}</span>
                                    <span className="text-xs text-gray-400">({realPercent}%)</span>
                                </div>
                            </div>
                          );
                      });
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
