
import React, { useEffect, useState } from 'react';
import SalesTrendGraph from './SalesTrendGraph';
import WeeklySalesGraph from './WeeklySalesGraph';
import AgeGenderSalesGraph from './AgeGenderSalesGraph';
import TimeOfDaySalesGraph from './TimeOfDaySalesGraph';
import AgeGenderRadarChart from './AgeGenderRadarChart';
import StoreTabContent from './StoreTabContent';
import AnimatedNumber from '../common/AnimatedNumber';
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

  const queryParam = regionCode || title;

  useEffect(() => {
    async function fetchData() {
        if (!queryParam) return;
        setLoading(true);
        try {
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

  const formatCurrency = (val: string) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) return val;
      
      if (num < 100000000) {
          return `${num.toLocaleString()}원`;
      }
      
      const billion = Math.round(num / 100000000);
      return `${billion.toLocaleString()}억 원`;
  };









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
                  {loading ? 'Loading...' : (
                      data ? (
                          <AnimatedNumber 
                              value={parseInt(data.sales.total, 10)} 
                              format={(n) => formatCurrency(n.toString())} 
                          />
                      ) : initialEstimatedSales
                  )}
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
          <StoreTabContent data={data} initialStoreCount={initialStoreCount} />
        )}

        {activeTab === 'population' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">총 주거 인구</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-extrabold text-blue-600">
                    {data && data.population ? <AnimatedNumber value={data.population.total} /> : '0'}
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
